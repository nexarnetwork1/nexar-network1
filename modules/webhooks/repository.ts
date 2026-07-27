import { createHash, createHmac, randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { webhooksConfig } from "@/config/webhooks";
import { assertSafeExternalUrl } from "@/lib/security/ssrf";
import type { MerchantWebhook, WebhookEvent } from "@/types";

export function generateWebhookSecret(): { secret: string; hash: string; prefix: string } {
  const secret = randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(secret).digest("hex");
  const prefix = secret.slice(0, 8);
  return { secret, hash, prefix };
}

export function signWebhookPayload(secret: string, payload: string, timestamp: number): string {
  return createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
}

export async function getStoreWebhooks(storeId: string): Promise<MerchantWebhook[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("merchant_webhooks")
    .select("id, store_id, url, secret_prefix, events, is_active, created_by, created_at, updated_at")
    .eq("store_id", storeId);
  return (data ?? []) as MerchantWebhook[];
}

export async function createStoreWebhook(params: {
  storeId: string;
  url: string;
  events: WebhookEvent[];
  createdBy: string;
}): Promise<{ webhook?: MerchantWebhook; secret?: string; error?: string }> {
  assertSafeExternalUrl(params.url);
  const { secret, hash, prefix } = generateWebhookSecret();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("merchant_webhooks")
    .insert({
      store_id: params.storeId,
      url: params.url,
      secret_hash: hash,
      secret_prefix: prefix,
      events: params.events,
      created_by: params.createdBy,
    })
    .select("id, store_id, url, secret_prefix, events, is_active, created_by, created_at, updated_at")
    .single();

  if (error) return { error: error.message };
  return { webhook: data as MerchantWebhook, secret };
}

export async function enqueueWebhookDelivery(params: {
  storeId: string;
  event: WebhookEvent;
  payload: Record<string, unknown>;
}): Promise<void> {
  const admin = createAdminClient();
  const { data: webhooks } = await admin
    .from("merchant_webhooks")
    .select("id, events")
    .eq("store_id", params.storeId)
    .eq("is_active", true);

  for (const webhook of webhooks ?? []) {
    const events = webhook.events as WebhookEvent[];
    if (!events.includes(params.event)) continue;

    await admin.from("webhook_deliveries").insert({
      webhook_id: webhook.id,
      event: params.event,
      payload: params.payload,
      status: "pending",
      next_retry_at: new Date().toISOString(),
    });
  }
}

export async function processPendingWebhookDeliveries(limit = 20): Promise<{
  processed: number;
  delivered: number;
  failed: number;
}> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: deliveries } = await admin
    .from("webhook_deliveries")
    .select("*, webhook:merchant_webhooks(url, secret_hash)")
    .in("status", ["pending", "retrying", "failed"])
    .lte("next_retry_at", now)
    .lt("attempt_count", webhooksConfig.maxRetries)
    .limit(limit);

  let delivered = 0;
  let failed = 0;

  for (const delivery of deliveries ?? []) {
    const webhook = delivery.webhook as { url: string; secret_hash: string } | null;
    if (!webhook) continue;

    const payload = JSON.stringify(delivery.payload);
    const timestamp = Math.floor(Date.now() / 1000);

    try {
      const url = assertSafeExternalUrl(webhook.url);
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [webhooksConfig.signatureHeader]: signWebhookPayload(webhook.secret_hash, payload, timestamp),
          "x-nexar-timestamp": String(timestamp),
          "x-nexar-event": delivery.event,
        },
        body: payload,
        signal: AbortSignal.timeout(10_000),
      });

      if (response.ok) {
        await admin
          .from("webhook_deliveries")
          .update({
            status: "delivered",
            delivered_at: new Date().toISOString(),
            response_code: response.status,
            attempt_count: delivery.attempt_count + 1,
          })
          .eq("id", delivery.id);
        delivered += 1;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      const attempt = delivery.attempt_count + 1;
      const delay = webhooksConfig.retryDelayMs[attempt - 1] ?? webhooksConfig.retryDelayMs.at(-1)!;
      await admin
        .from("webhook_deliveries")
        .update({
          status: attempt >= webhooksConfig.maxRetries ? "failed" : "retrying",
          attempt_count: attempt,
          next_retry_at: new Date(Date.now() + delay).toISOString(),
          response_body: err instanceof Error ? err.message : String(err),
        })
        .eq("id", delivery.id);
      failed += 1;
    }
  }

  return { processed: deliveries?.length ?? 0, delivered, failed };
}
