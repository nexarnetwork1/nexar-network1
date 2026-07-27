"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/modules/users/repository";
import type { ActionResult } from "@/modules/auth/actions";
import type { UserRole, StoreStatus } from "@/types";

async function assertAdmin() {
  await requireRole(["admin"]);
}

export async function updatePlatformSettingsAction(
  formData: FormData
): Promise<ActionResult> {
  await assertAdmin();
  const admin = createAdminClient();

  const treasury = formData.get("treasuryWallet") as string;
  const supportEmail = formData.get("supportEmail") as string;
  const nxrToken = formData.get("nxrToken") as string;
  const usdtToken = formData.get("usdtToken") as string;

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
      treasury_wallet_address: treasury || null,
      support_email: supportEmail,
      nxr_token_address: nxrToken || null,
      usdt_token_address: usdtToken || null,
    })
    .eq("id", settings.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/platform-fees");
  revalidatePath("/admin/security");
  return { success: true };
}

export async function updateFeeScheduleAction(
  paymentType: string,
  baseRate: number
): Promise<ActionResult> {
  await assertAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("fee_schedules").insert({
    payment_type: paymentType,
    base_rate: baseRate,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/platform-fees");
  return { success: true };
}

export async function updateExchangeRateAction(
  formData: FormData
): Promise<ActionResult> {
  await assertAdmin();
  const admin = createAdminClient();

  const baseCurrency = formData.get("baseCurrency") as string;
  const rate = Number(formData.get("rate"));

  if (!baseCurrency || !rate || rate <= 0) {
    return { success: false, error: "Invalid rate" };
  }

  const { error } = await admin.from("exchange_rates").upsert(
    {
      base_currency: baseCurrency.toUpperCase(),
      quote_currency: "USD",
      rate,
      source: "admin",
      fetched_at: new Date().toISOString(),
    },
    { onConflict: "base_currency,quote_currency" }
  );

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/exchange-rates");
  return { success: true };
}

export async function updateStoreStatusAction(
  storeId: string,
  status: StoreStatus
): Promise<ActionResult> {
  await assertAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("stores")
    .update({ status })
    .eq("id", storeId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/merchants");
  return { success: true };
}

export async function updateUserRoleAction(
  userId: string,
  role: UserRole
): Promise<ActionResult> {
  await assertAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

  try {
    await admin.auth.admin.updateUserById(userId, {
      app_metadata: { role },
    });
  } catch {
    // app_metadata sync optional
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function togglePromotionAction(
  promotionId: string,
  isActive: boolean
): Promise<ActionResult> {
  await assertAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("merchant_promotions")
    .update({ is_active: isActive })
    .eq("id", promotionId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/promotions");
  return { success: true };
}
