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
  policies: z.string().max(5000).optional(),
  featured: z.coerce.boolean().optional(),
});

async function uploadStoreLogo(
  storeId: string,
  file: File
): Promise<string | null> {
  const supabase = await createClient();
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${storeId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("store-logos")
    .upload(path, file, { upsert: true });

  if (error) return null;
  const { data } = supabase.storage.from("store-logos").getPublicUrl(path);
  return data.publicUrl;
}

function buildMarketplaceProfile(parsed: z.infer<typeof marketplaceProfileSchema>) {
  return {
    banner_url: parsed.bannerUrl || null,
    description: parsed.description || null,
    primary_color: parsed.primaryColor || null,
    secondary_color: parsed.secondaryColor || null,
    website: parsed.website || null,
    facebook: parsed.facebook || null,
    instagram: parsed.instagram || null,
    twitter: parsed.twitter || null,
    tiktok: parsed.tiktok || null,
    business_phone: parsed.businessPhone || null,
    business_email: parsed.businessEmail || null,
    business_address: parsed.businessAddress || null,
    business_hours: parsed.businessHours
      ? { general: parsed.businessHours }
      : null,
    policies: parsed.policies || null,
    featured: parsed.featured ?? false,
  };
}

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

  const marketplace_profile = buildMarketplaceProfile(parsed.data);

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

export async function updateStoreAppearanceAction(
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireRole(["merchant"]);
  const store = await getMerchantStore(profile.id);
  if (!store) return { success: false, error: "Store not found" };

  const primaryColor =
    (formData.get("primaryColorText") as string) ||
    (formData.get("primaryColor") as string) ||
    "";
  const secondaryColor =
    (formData.get("secondaryColorText") as string) ||
    (formData.get("secondaryColor") as string) ||
    "";

  const parsed = marketplaceProfileSchema.safeParse({
    bannerUrl: formData.get("bannerUrl") || "",
    description: formData.get("description") || "",
    primaryColor,
    secondaryColor,
    website: formData.get("website") || "",
    facebook: formData.get("facebook") || "",
    instagram: formData.get("instagram") || "",
    twitter: formData.get("twitter") || "",
    tiktok: formData.get("tiktok") || "",
    businessPhone: formData.get("businessPhone") || "",
    businessEmail: formData.get("businessEmail") || "",
    businessAddress: formData.get("businessAddress") || "",
    businessHours: formData.get("businessHours") || "",
    policies: formData.get("policies") || "",
    featured: formData.get("featured") === "on",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const logoFile = formData.get("logo") as File | null;
  let logoUrl: string | undefined;
  if (logoFile && logoFile.size > 0) {
    const uploaded = await uploadStoreLogo(store.id, logoFile);
    if (!uploaded) return { success: false, error: "Failed to upload logo" };
    logoUrl = uploaded;
  }

  const supabase = await createClient();

  if (logoUrl) {
    const { error: logoError } = await supabase
      .from("stores")
      .update({ logo_url: logoUrl })
      .eq("id", store.id);
    if (logoError) return { success: false, error: logoError.message };
  }

  const { error } = await supabase
    .from("store_settings")
    .update({ marketplace_profile: buildMarketplaceProfile(parsed.data) })
    .eq("store_id", store.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/merchant/store");
  revalidatePath("/customer/browse");
  revalidatePath(`/store/${store.slug}`);
  revalidatePath("/marketplace/stores");
  return { success: true };
}
