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

const marketplaceProfileSchema = z.object({
  bannerUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().max(2000).optional(),
  primaryColor: z.string().max(20).optional(),
  secondaryColor: z.string().max(20).optional(),
  website: z.string().url().optional().or(z.literal("")),
  facebook: z.string().url().optional().or(z.literal("")),
  instagram: z.string().url().optional().or(z.literal("")),
  twitter: z.string().url().optional().or(z.literal("")),
  tiktok: z.string().url().optional().or(z.literal("")),
  businessPhone: z.string().max(50).optional(),
  businessEmail: z.string().email().optional().or(z.literal("")),
  businessAddress: z.string().max(500).optional(),
  businessHours: z.string().max(200).optional(),
  featured: z.coerce.boolean().optional(),
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

export async function updateStoreMarketplaceProfileAction(
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireRole(["merchant"]);
  const store = await getMerchantStore(profile.id);
  if (!store) return { success: false, error: "Store not found" };

  const parsed = marketplaceProfileSchema.safeParse({
    bannerUrl: formData.get("bannerUrl") || "",
    description: formData.get("description") || "",
    primaryColor: formData.get("primaryColor") || "",
    secondaryColor: formData.get("secondaryColor") || "",
    website: formData.get("website") || "",
    facebook: formData.get("facebook") || "",
    instagram: formData.get("instagram") || "",
    twitter: formData.get("twitter") || "",
    tiktok: formData.get("tiktok") || "",
    businessPhone: formData.get("businessPhone") || "",
    businessEmail: formData.get("businessEmail") || "",
    businessAddress: formData.get("businessAddress") || "",
    businessHours: formData.get("businessHours") || "",
    featured: formData.get("featured") === "on",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const marketplace_profile = {
    banner_url: parsed.data.bannerUrl || null,
    description: parsed.data.description || null,
    primary_color: parsed.data.primaryColor || null,
    secondary_color: parsed.data.secondaryColor || null,
    website: parsed.data.website || null,
    facebook: parsed.data.facebook || null,
    instagram: parsed.data.instagram || null,
    twitter: parsed.data.twitter || null,
    tiktok: parsed.data.tiktok || null,
    business_phone: parsed.data.businessPhone || null,
    business_email: parsed.data.businessEmail || null,
    business_address: parsed.data.businessAddress || null,
    business_hours: parsed.data.businessHours
      ? { general: parsed.data.businessHours }
      : null,
    featured: parsed.data.featured ?? false,
  };

  const supabase = await createClient();
  const { error } = await supabase
    .from("store_settings")
    .update({ marketplace_profile })
    .eq("store_id", store.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/merchant/store");
  revalidatePath(`/store/${store.slug}`);
  return { success: true };
}
