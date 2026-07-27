"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/modules/users/repository";
import { auditLogger } from "@/lib/logging/audit-logger";
import {
  platformSettingsSchema,
  feeScheduleSchema,
  exchangeRateSchema,
  storeStatusSchema,
  userRoleSchema,
} from "./validators";
import { createNotification } from "@/modules/notifications/repository";
import { buildQrPayload } from "@/lib/qr/payload";
import type { ActionResult } from "@/modules/auth/actions";
import type { StoreStatus } from "@/types";

async function assertAdmin() {
  return requireRole(["admin"]);
}

async function ensureStoreQrCodes(
  storeId: string,
  slug: string
): Promise<void> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("qr_codes")
    .select("qr_type")
    .eq("store_id", storeId);

  const types = new Set((existing ?? []).map((row) => row.qr_type));

  if (!types.has("marketplace")) {
    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    await admin.from("qr_codes").insert({
      store_id: storeId,
      qr_type: "marketplace",
      secret_token: token,
      payload: buildQrPayload(token),
    });
  }

  if (!types.has("payment_only")) {
    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    await admin.from("qr_codes").insert({
      store_id: storeId,
      qr_type: "payment_only",
      secret_token: token,
      payload: buildQrPayload(token),
    });
  }
}

export async function updatePlatformSettingsAction(
  formData: FormData
): Promise<ActionResult> {
  const profile = await assertAdmin();

  const parsed = platformSettingsSchema.safeParse({
    treasuryWallet: formData.get("treasuryWallet") || "",
    supportEmail: formData.get("supportEmail"),
    nxrToken: formData.get("nxrToken") || "",
    usdtToken: formData.get("usdtToken") || "",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const admin = createAdminClient();
  const { data: settings } = await admin
    .from("platform_settings")
    .select("id")
    .limit(1)
    .single();

  if (!settings) {
    return { success: false, error: "Platform settings not found" };
  }

  const { error } = await admin
    .from("platform_settings")
    .update({
      treasury_wallet_address: parsed.data.treasuryWallet || null,
      support_email: parsed.data.supportEmail,
      nxr_token_address: parsed.data.nxrToken || null,
      usdt_token_address: parsed.data.usdtToken || null,
    })
    .eq("id", settings.id);

  if (error) return { success: false, error: error.message };

  auditLogger.log({
    action: "admin.platform_settings.updated",
    entityType: "platform_settings",
    entityId: settings.id,
    actorId: profile.id,
    actorRole: profile.role,
  });

  revalidatePath("/admin/platform-fees");
  revalidatePath("/admin/security");
  return { success: true };
}

export async function updateFeeScheduleAction(
  paymentType: string,
  baseRate: number
): Promise<ActionResult> {
  const profile = await assertAdmin();

  const parsed = feeScheduleSchema.safeParse({ paymentType, baseRate });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("fee_schedules").insert({
    payment_type: parsed.data.paymentType,
    base_rate: parsed.data.baseRate,
  }).select("id").single();

  if (error) return { success: false, error: error.message };

  auditLogger.log({
    action: "admin.fee_schedule.created",
    entityType: "fee_schedule",
    entityId: data?.id,
    actorId: profile.id,
    actorRole: profile.role,
    metadata: parsed.data,
  });

  revalidatePath("/admin/platform-fees");
  return { success: true };
}

export async function updateExchangeRateAction(
  formData: FormData
): Promise<ActionResult> {
  const profile = await assertAdmin();

  const parsed = exchangeRateSchema.safeParse({
    baseCurrency: formData.get("baseCurrency"),
    rate: formData.get("rate"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("exchange_rates").upsert(
    {
      base_currency: parsed.data.baseCurrency,
      quote_currency: "USD",
      rate: parsed.data.rate,
      source: "admin",
      fetched_at: new Date().toISOString(),
    },
    { onConflict: "base_currency,quote_currency" }
  );

  if (error) return { success: false, error: error.message };

  auditLogger.log({
    action: "admin.exchange_rate.updated",
    entityType: "exchange_rate",
    actorId: profile.id,
    actorRole: profile.role,
    metadata: parsed.data,
  });

  revalidatePath("/admin/exchange-rates");
  return { success: true };
}

export async function updateStoreStatusAction(
  storeId: string,
  status: StoreStatus
): Promise<ActionResult> {
  const profile = await assertAdmin();

  const parsed = storeStatusSchema.safeParse({ storeId, status });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const admin = createAdminClient();

  const { data: store } = await admin
    .from("stores")
    .select("owner_id, name, slug")
    .eq("id", parsed.data.storeId)
    .single();

  const { error } = await admin
    .from("stores")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.storeId);

  if (error) return { success: false, error: error.message };

  if (parsed.data.status === "active" && store?.slug) {
    await ensureStoreQrCodes(parsed.data.storeId, store.slug).catch(() => undefined);
  }

  if (store?.owner_id) {
    const titles: Record<StoreStatus, string> = {
      pending: "Store status updated",
      active: "Store approved",
      suspended: "Store suspended",
    };
    const bodies: Record<StoreStatus, string> = {
      pending: `${store.name} is pending review.`,
      active: `${store.name} is now active on Nexar Network.`,
      suspended: `${store.name} has been suspended.`,
    };

    await createNotification({
      userId: store.owner_id,
      type: "system",
      title: titles[parsed.data.status],
      body: bodies[parsed.data.status],
      metadata: { store_id: parsed.data.storeId, status: parsed.data.status },
    }).catch(() => undefined);
  }

  auditLogger.log({
    action: "admin.store.status_updated",
    entityType: "store",
    entityId: parsed.data.storeId,
    actorId: profile.id,
    actorRole: profile.role,
    metadata: { status: parsed.data.status },
  });

  revalidatePath("/admin/merchants");
  return { success: true };
}

export async function updateUserRoleAction(
  userId: string,
  role: "customer" | "merchant" | "admin"
): Promise<ActionResult> {
  const profile = await assertAdmin();

  const parsed = userRoleSchema.safeParse({ userId, role });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.userId);

  if (error) return { success: false, error: error.message };

  try {
    await admin.auth.admin.updateUserById(parsed.data.userId, {
      app_metadata: { role: parsed.data.role },
    });
  } catch {
    // app_metadata sync optional
  }

  auditLogger.log({
    action: "admin.user.role_updated",
    entityType: "profile",
    entityId: parsed.data.userId,
    actorId: profile.id,
    actorRole: profile.role,
    metadata: { role: parsed.data.role },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function togglePromotionAction(
  promotionId: string,
  isActive: boolean
): Promise<ActionResult> {
  const profile = await assertAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("merchant_promotions")
    .update({ is_active: isActive })
    .eq("id", promotionId);

  if (error) return { success: false, error: error.message };

  auditLogger.log({
    action: "admin.promotion.toggled",
    entityType: "merchant_promotion",
    entityId: promotionId,
    actorId: profile.id,
    actorRole: profile.role,
    metadata: { is_active: isActive },
  });

  revalidatePath("/admin/promotions");
  return { success: true };
}

export async function retryFailedSettlementsAction(): Promise<
  ActionResult & { attempted?: number; succeeded?: number; failed?: number }
> {
  const profile = await assertAdmin();
  const { retryFailedSettlements } = await import("@/modules/settlement/worker");

  const result = await retryFailedSettlements(20);

  auditLogger.log({
    action: "admin.settlements.retry",
    entityType: "settlement",
    actorId: profile.id,
    actorRole: profile.role,
    metadata: result,
  });

  revalidatePath("/admin/analytics");
  return { success: true, ...result };
}
