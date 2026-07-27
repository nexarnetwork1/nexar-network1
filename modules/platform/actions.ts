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
import type { ActionResult } from "@/modules/auth/actions";
import type { StoreStatus } from "@/types";

async function assertAdmin() {
  return requireRole(["admin"]);
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
  const { error } = await admin
    .from("stores")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.storeId);

  if (error) return { success: false, error: error.message };

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
