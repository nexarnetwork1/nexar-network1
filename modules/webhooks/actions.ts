"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuthenticatedProfile, requireStoreOwner } from "@/lib/auth/guards";
import { createStoreWebhook } from "./repository";
import { writeAuditLog } from "@/modules/audit/repository";
import type { ActionResult } from "@/modules/auth/actions";
import type { WebhookEvent } from "@/types";

const webhookSchema = z.object({
  storeId: z.string().uuid(),
  url: z.string().url(),
  events: z.string().min(1),
});

export async function createWebhookFormAction(formData: FormData): Promise<void> {
  await createWebhookAction(formData);
}

export async function createWebhookAction(formData: FormData): Promise<ActionResult & { secret?: string }> {
  const profile = await requireAuthenticatedProfile(["merchant"]);
  const parsed = webhookSchema.safeParse({
    storeId: formData.get("storeId"),
    url: formData.get("url"),
    events: formData.get("events"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await requireStoreOwner(parsed.data.storeId);

  const events = parsed.data.events.split(",").map((e) => e.trim()) as WebhookEvent[];
  const result = await createStoreWebhook({
    storeId: parsed.data.storeId,
    url: parsed.data.url,
    events,
    createdBy: profile.id,
  });

  if (result.error) return { success: false, error: result.error };

  await writeAuditLog({
    actorId: profile.id,
    actorRole: profile.role,
    action: "webhook.created",
    entityType: "merchant_webhook",
    entityId: result.webhook?.id,
    metadata: { url: parsed.data.url, events },
  });

  revalidatePath("/merchant/webhooks");
  return { success: true, secret: result.secret };
}
