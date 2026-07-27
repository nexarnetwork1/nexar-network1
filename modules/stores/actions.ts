"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import type { ActionResult } from "@/modules/auth/actions";

const storeSettingsSchema = z.object({
  notificationEmail: z.string().email().optional().or(z.literal("")),
  autoAcceptOrders: z.coerce.boolean().optional(),
  minOrderAmountUsd: z.coerce.number().min(0).optional(),
  defaultCurrency: z.string().length(3).optional(),
  acceptsCrypto: z.coerce.boolean().optional(),
  acceptsCard: z.coerce.boolean().optional(),
});

export async function updateStoreSettingsAction(
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireRole(["merchant"]);
  const store = await getMerchantStore(profile.id);
  if (!store) return { success: false, error: "Store not found" };

  const parsed = storeSettingsSchema.safeParse({
    notificationEmail: formData.get("notificationEmail") || undefined,
    autoAcceptOrders: formData.get("autoAcceptOrders") === "on",
    minOrderAmountUsd: formData.get("minOrderAmountUsd"),
    defaultCurrency: formData.get("defaultCurrency"),
    acceptsCrypto: formData.get("acceptsCrypto") === "on",
    acceptsCard: formData.get("acceptsCard") === "on",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("store_settings")
    .update({
      notification_email: parsed.data.notificationEmail || null,
      auto_accept_orders: parsed.data.autoAcceptOrders ?? true,
      min_order_amount_usd: parsed.data.minOrderAmountUsd ?? 0,
      default_currency: parsed.data.defaultCurrency ?? "USD",
      accepts_crypto: parsed.data.acceptsCrypto ?? true,
      accepts_card: parsed.data.acceptsCard ?? false,
    })
    .eq("store_id", store.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/merchant/store");
  return { success: true };
}
