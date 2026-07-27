"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/modules/users/repository";
import { auditLogger } from "@/lib/logging/audit-logger";
import { writeAuditLog } from "@/modules/audit/repository";
import {
  platformSettingsSchema,
  feeScheduleSchema,
  exchangeRateSchema,
  storeStatusSchema,
  userRoleSchema,
  productModerationSchema,
  currencyToggleSchema,
  createPromotionSchema,
  banUserSchema,
} from "./validators";
import { createNotification } from "@/modules/notifications/repository";
import { buildQrPayload } from "@/lib/qr/payload";
import type { ActionResult } from "@/modules/auth/actions";
import type { StoreStatus } from "@/types";

async function logAdminAction(
  session: { walletAddress: string },
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Record<string, unknown>
) {
  auditLogger.log({
    action,
    entityType,
    entityId,
    metadata: { wallet_address: session.walletAddress, ...metadata },
  });
  await writeAuditLog({
    actorId: null,
    actorRole: "admin",
    action,
    entityType,
    entityId,
    metadata: { wallet_address: session.walletAddress, ...metadata },
  });
}

async function assertAdmin() {
  return requireSuperAdmin();
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
  const session = await assertAdmin();

  const parsed = platformSettingsSchema.safeParse({
    treasuryWallet: formData.get("treasuryWallet") || "",
    supportEmail: formData.get("supportEmail"),
    nxrToken: formData.get("nxrToken") || "",
    usdtToken: formData.get("usdtToken") || "",
    maintenanceMode: formData.get("maintenanceMode") === "on",
    platformStatus: formData.get("platformStatus") || "operational",
    minPaymentUsd: formData.get("minPaymentUsd") || undefined,
    maxPaymentUsd: formData.get("maxPaymentUsd") || undefined,
    emailNotificationsEnabled: formData.get("emailNotificationsEnabled") === "on",
    telegramNotificationsEnabled: formData.get("telegramNotificationsEnabled") === "on",
    merchantPromotionDiscountPercent: formData.get("merchantPromotionDiscountPercent") || undefined,
    merchantPromotionDurationDays: formData.get("merchantPromotionDurationDays") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const admin = createAdminClient();
  const { data: settings } = await admin
    .from("platform_settings")
    .select("*")
    .limit(1)
    .single();

  if (!settings) {
    return { success: false, error: "Platform settings not found" };
  }

  const nextTreasury = parsed.data.treasuryWallet || null;
  const treasuryChanged =
    nextTreasury !== settings.treasury_wallet_address;

  const { error } = await admin
    .from("platform_settings")
    .update({
      treasury_wallet_address: nextTreasury,
      support_email: parsed.data.supportEmail,
      nxr_token_address: parsed.data.nxrToken || null,
      usdt_token_address: parsed.data.usdtToken || null,
      maintenance_mode: parsed.data.maintenanceMode ?? settings.maintenance_mode,
      platform_status: parsed.data.platformStatus ?? settings.platform_status,
      min_payment_usd: parsed.data.minPaymentUsd ?? settings.min_payment_usd,
      max_payment_usd: parsed.data.maxPaymentUsd ?? settings.max_payment_usd,
      email_notifications_enabled:
        parsed.data.emailNotificationsEnabled ?? settings.email_notifications_enabled,
      telegram_notifications_enabled:
        parsed.data.telegramNotificationsEnabled ?? settings.telegram_notifications_enabled,
      merchant_promotion_discount_percent:
        parsed.data.merchantPromotionDiscountPercent ??
        settings.merchant_promotion_discount_percent,
      merchant_promotion_duration_days:
        parsed.data.merchantPromotionDurationDays ??
        settings.merchant_promotion_duration_days,
    })
    .eq("id", settings.id);

  if (error) return { success: false, error: error.message };

  await logAdminAction(session, "admin.platform_settings.changed", "platform_settings", settings.id, {
    before: {
      treasury_wallet_address: settings.treasury_wallet_address,
      platform_status: settings.platform_status,
      maintenance_mode: settings.maintenance_mode,
    },
    after: {
      treasury_wallet_address: nextTreasury,
      platform_status: parsed.data.platformStatus,
      maintenance_mode: parsed.data.maintenanceMode,
    },
  });

  if (treasuryChanged) {
    await logAdminAction(session, "admin.treasury_wallet.changed", "platform_settings", settings.id, {
      before: settings.treasury_wallet_address,
      after: nextTreasury,
    });
  }

  revalidatePath("/admin/platform-fees");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/security");
  return { success: true };
}

export async function updateFeeScheduleAction(
  paymentType: string,
  baseRate: number
): Promise<ActionResult> {
  const session = await assertAdmin();

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

  await logAdminAction(session, "admin.fee_schedule.created", "fee_schedule", data?.id, parsed.data);

  revalidatePath("/admin/platform-fees");
  return { success: true };
}

export async function updateExchangeRateAction(
  formData: FormData
): Promise<ActionResult> {
  const session = await assertAdmin();

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

  await logAdminAction(session, "admin.exchange_rate.updated", "exchange_rate", undefined, parsed.data);

  revalidatePath("/admin/exchange-rates");
  return { success: true };
}

export async function updateStoreStatusAction(
  storeId: string,
  status: StoreStatus
): Promise<ActionResult> {
  const session = await assertAdmin();

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

  await logAdminAction(session, "admin.store.status_updated", "store", parsed.data.storeId, {
    status: parsed.data.status,
  });

  revalidatePath("/admin/merchants");
  return { success: true };
}

export async function updateUserRoleAction(
  userId: string,
  role: "customer" | "merchant" | "admin"
): Promise<ActionResult> {
  const session = await assertAdmin();

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

  await logAdminAction(session, "admin.user.role_updated", "profile", parsed.data.userId, {
    role: parsed.data.role,
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function togglePromotionAction(
  promotionId: string,
  isActive: boolean
): Promise<ActionResult> {
  const session = await assertAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("merchant_promotions")
    .update({ is_active: isActive })
    .eq("id", promotionId);

  if (error) return { success: false, error: error.message };

  await logAdminAction(session, "admin.promotion.toggled", "merchant_promotion", promotionId, {
    is_active: isActive,
  });

  revalidatePath("/admin/promotions");
  return { success: true };
}

export async function retryFailedSettlementsAction(): Promise<
  ActionResult & { attempted?: number; succeeded?: number; failed?: number }
> {
  const session = await assertAdmin();
  const { retryFailedSettlements } = await import("@/modules/settlement/worker");

  const result = await retryFailedSettlements(20);

  await logAdminAction(session, "admin.settlements.retry", "settlement", undefined, result);

  revalidatePath("/admin/analytics");
  return { success: true, ...result };
}

export async function moderateProductAction(
  productId: string,
  isActive: boolean
): Promise<ActionResult> {
  const session = await assertAdmin();
  const parsed = productModerationSchema.safeParse({ productId, isActive });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("products")
    .update({ is_active: parsed.data.isActive })
    .eq("id", parsed.data.productId);

  if (error) return { success: false, error: error.message };

  await logAdminAction(session, "admin.product.moderated", "product", parsed.data.productId, {
    is_active: parsed.data.isActive,
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/marketplace");
  return { success: true };
}

export async function toggleCurrencyAction(
  currencyId: string,
  isActive: boolean
): Promise<ActionResult> {
  const session = await assertAdmin();
  const parsed = currencyToggleSchema.safeParse({ currencyId, isActive });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("supported_currencies")
    .update({ is_active: parsed.data.isActive })
    .eq("id", parsed.data.currencyId);

  if (error) return { success: false, error: error.message };

  await logAdminAction(session, "admin.currency.toggled", "supported_currency", parsed.data.currencyId, {
    is_active: parsed.data.isActive,
  });

  revalidatePath("/admin/currencies");
  return { success: true };
}

export async function createPromotionAction(formData: FormData): Promise<ActionResult> {
  const session = await assertAdmin();
  const parsed = createPromotionSchema.safeParse({
    storeId: formData.get("storeId"),
    discountPercent: formData.get("discountPercent"),
    months: formData.get("months") ?? 3,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const admin = createAdminClient();
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + parsed.data.months);

  const { data, error } = await admin
    .from("merchant_promotions")
    .insert({
      store_id: parsed.data.storeId,
      promotion_type: "platform_fee_discount",
      discount_percent: parsed.data.discountPercent,
      starts_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      is_active: true,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  await logAdminAction(session, "admin.promotion.created", "merchant_promotion", data?.id, parsed.data);

  revalidatePath("/admin/promotions");
  return { success: true };
}

export async function banUserAction(userId: string, ban: boolean): Promise<ActionResult> {
  const session = await assertAdmin();
  const parsed = banUserSchema.safeParse({ userId, ban });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(parsed.data.userId, {
    ban_duration: parsed.data.ban ? "876000h" : "none",
  });

  if (error) return { success: false, error: error.message };

  await logAdminAction(session, parsed.data.ban ? "admin.user.banned" : "admin.user.unbanned", "profile", parsed.data.userId);

  revalidatePath("/admin/customers");
  revalidatePath("/admin/users");
  revalidatePath("/admin/merchants");
  return { success: true };
}

export async function resetUserPasswordAction(userId: string): Promise<ActionResult & { link?: string }> {
  const session = await assertAdmin();

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();

  if (!target?.email) {
    return { success: false, error: "User not found" };
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: target.email,
  });

  if (error) return { success: false, error: error.message };

  await logAdminAction(session, "admin.user.password_reset", "profile", userId);

  revalidatePath("/admin/customers");
  revalidatePath("/admin/users");
  return { success: true, link: data.properties?.action_link };
}
