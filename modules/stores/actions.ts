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
  accentColor: z.string().max(20).optional(),
  faviconUrl: z.string().url().optional().or(z.literal("")),
  typography: z.string().max(50).optional(),
  buttonStyle: z.string().max(50).optional(),
  borderRadius: z.string().max(20).optional(),
  website: z.string().url().optional().or(z.literal("")),
  facebook: z.string().url().optional().or(z.literal("")),
  instagram: z.string().url().optional().or(z.literal("")),
  twitter: z.string().url().optional().or(z.literal("")),
  tiktok: z.string().url().optional().or(z.literal("")),
  linkedin: z.string().url().optional().or(z.literal("")),
  youtube: z.string().url().optional().or(z.literal("")),
  telegram: z.string().url().optional().or(z.literal("")),
  discord: z.string().url().optional().or(z.literal("")),
  businessPhone: z.string().max(50).optional(),
  businessEmail: z.string().email().optional().or(z.literal("")),
  businessAddress: z.string().max(500).optional(),
  businessHours: z.string().max(200).optional(),
  country: z.string().max(80).optional(),
  language: z.string().max(20).optional(),
  timezone: z.string().max(60).optional(),
  policies: z.string().max(5000).optional(),
  privacyPolicy: z.string().max(5000).optional(),
  refundPolicy: z.string().max(5000).optional(),
  shippingPolicy: z.string().max(5000).optional(),
  terms: z.string().max(5000).optional(),
  seoTitle: z.string().max(120).optional(),
  seoDescription: z.string().max(320).optional(),
  seoKeywords: z.string().max(500).optional(),
  ogImage: z.string().url().optional().or(z.literal("")),
  canonicalUrl: z.string().url().optional().or(z.literal("")),
  featured: z.coerce.boolean().optional(),
});

const storeGeneralSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().max(2000).optional(),
  businessEmail: z.string().email().optional().or(z.literal("")),
  businessPhone: z.string().max(50).optional(),
  businessAddress: z.string().max(500).optional(),
  country: z.string().max(80).optional(),
  language: z.string().max(20).optional(),
  timezone: z.string().max(60).optional(),
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

async function uploadStoreAsset(
  storeId: string,
  file: File,
  bucket: "store-logos" | "store-banners",
): Promise<string | null> {
  const supabase = await createClient();
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${storeId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) return null;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function syncStoreBranding(
  storeId: string,
  profile: ReturnType<typeof buildMarketplaceProfile>,
  tagline?: string,
) {
  const supabase = await createClient();
  const social_links = {
    website: profile.website,
    facebook: profile.facebook,
    instagram: profile.instagram,
    twitter: profile.twitter,
    tiktok: profile.tiktok,
    linkedin: profile.linkedin,
    youtube: profile.youtube,
    telegram: profile.telegram,
    discord: profile.discord,
  };

  const policiesText = [
    profile.privacy_policy && `Privacy: ${profile.privacy_policy}`,
    profile.refund_policy && `Refunds: ${profile.refund_policy}`,
    profile.shipping_policy && `Shipping: ${profile.shipping_policy}`,
    profile.terms && `Terms: ${profile.terms}`,
    profile.policies,
  ]
    .filter(Boolean)
    .join("\n\n");

  await supabase.from("store_branding").upsert(
    {
      store_id: storeId,
      banner_url: profile.banner_url,
      primary_color: profile.primary_color,
      secondary_color: profile.secondary_color,
      accent_color: profile.accent_color,
      tagline: tagline ?? profile.description?.slice(0, 120) ?? null,
      social_links,
      policies: policiesText || profile.policies,
      featured: profile.featured ?? false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "store_id" },
  );
}

function buildMarketplaceProfile(parsed: z.infer<typeof marketplaceProfileSchema>) {
  return {
    banner_url: parsed.bannerUrl || null,
    description: parsed.description || null,
    primary_color: parsed.primaryColor || null,
    secondary_color: parsed.secondaryColor || null,
    accent_color: parsed.accentColor || null,
    favicon_url: parsed.faviconUrl || null,
    typography: parsed.typography || null,
    button_style: parsed.buttonStyle || null,
    border_radius: parsed.borderRadius || null,
    website: parsed.website || null,
    facebook: parsed.facebook || null,
    instagram: parsed.instagram || null,
    twitter: parsed.twitter || null,
    tiktok: parsed.tiktok || null,
    linkedin: parsed.linkedin || null,
    youtube: parsed.youtube || null,
    telegram: parsed.telegram || null,
    discord: parsed.discord || null,
    business_phone: parsed.businessPhone || null,
    business_email: parsed.businessEmail || null,
    business_address: parsed.businessAddress || null,
    business_hours: parsed.businessHours
      ? { general: parsed.businessHours }
      : null,
    country: parsed.country || null,
    language: parsed.language || null,
    timezone: parsed.timezone || null,
    policies: parsed.policies || null,
    privacy_policy: parsed.privacyPolicy || null,
    refund_policy: parsed.refundPolicy || null,
    shipping_policy: parsed.shippingPolicy || null,
    terms: parsed.terms || null,
    seo_title: parsed.seoTitle || null,
    seo_description: parsed.seoDescription || null,
    seo_keywords: parsed.seoKeywords || null,
    og_image: parsed.ogImage || null,
    canonical_url: parsed.canonicalUrl || null,
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

  await syncStoreBranding(store.id, marketplace_profile);

  revalidatePath("/merchant/store");
  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/stores/${store.slug}`);
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

  await syncStoreBranding(store.id, buildMarketplaceProfile(parsed.data));

  revalidatePath("/merchant/store");
  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/stores/${store.slug}`);
  return { success: true };
}

export async function saveStoreBuilderAction(formData: FormData): Promise<ActionResult> {
  const profile = await requireRole(["merchant"]);
  const store = await getMerchantStore(profile.id);
  if (!store) return { success: false, error: "Store not found" };

  const general = storeGeneralSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || "",
    businessEmail: formData.get("businessEmail") || "",
    businessPhone: formData.get("businessPhone") || "",
    businessAddress: formData.get("businessAddress") || "",
    country: formData.get("country") || "",
    language: formData.get("language") || "",
    timezone: formData.get("timezone") || "",
  });

  if (!general.success) {
    return { success: false, error: general.error.issues[0]?.message ?? "Invalid general info" };
  }

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
    description: general.data.description || formData.get("description") || "",
    primaryColor,
    secondaryColor,
    accentColor: formData.get("accentColor") || "",
    faviconUrl: formData.get("faviconUrl") || "",
    typography: formData.get("typography") || "",
    buttonStyle: formData.get("buttonStyle") || "",
    borderRadius: formData.get("borderRadius") || "",
    website: formData.get("website") || "",
    facebook: formData.get("facebook") || "",
    instagram: formData.get("instagram") || "",
    twitter: formData.get("twitter") || "",
    tiktok: formData.get("tiktok") || "",
    linkedin: formData.get("linkedin") || "",
    youtube: formData.get("youtube") || "",
    telegram: formData.get("telegram") || "",
    discord: formData.get("discord") || "",
    businessPhone: general.data.businessPhone || "",
    businessEmail: general.data.businessEmail || "",
    businessAddress: general.data.businessAddress || "",
    businessHours: formData.get("businessHours") || "",
    country: general.data.country || "",
    language: general.data.language || "",
    timezone: general.data.timezone || "",
    policies: formData.get("policies") || "",
    privacyPolicy: formData.get("privacyPolicy") || "",
    refundPolicy: formData.get("refundPolicy") || "",
    shippingPolicy: formData.get("shippingPolicy") || "",
    terms: formData.get("terms") || "",
    seoTitle: formData.get("seoTitle") || "",
    seoDescription: formData.get("seoDescription") || "",
    seoKeywords: formData.get("seoKeywords") || "",
    ogImage: formData.get("ogImage") || "",
    canonicalUrl: formData.get("canonicalUrl") || "",
    featured: formData.get("featured") === "on",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const logoFile = formData.get("logo") as File | null;
  const bannerFile = formData.get("banner") as File | null;
  let logoUrl: string | undefined;
  let bannerUrl = parsed.data.bannerUrl || undefined;

  if (logoFile && logoFile.size > 0) {
    const uploaded = await uploadStoreAsset(store.id, logoFile, "store-logos");
    if (!uploaded) return { success: false, error: "Failed to upload logo" };
    logoUrl = uploaded;
  }

  if (bannerFile && bannerFile.size > 0) {
    const uploaded = await uploadStoreAsset(store.id, bannerFile, "store-banners");
    if (!uploaded) return { success: false, error: "Failed to upload banner" };
    bannerUrl = uploaded;
  }

  const supabase = await createClient();
  const slugChanged = general.data.slug !== store.slug;

  const { error: storeError } = await supabase
    .from("stores")
    .update({
      name: general.data.name,
      slug: general.data.slug,
      ...(logoUrl ? { logo_url: logoUrl } : {}),
    })
    .eq("id", store.id);

  if (storeError) return { success: false, error: storeError.message };

  const marketplace_profile = {
    ...buildMarketplaceProfile(parsed.data),
    ...(bannerUrl ? { banner_url: bannerUrl } : {}),
  };

  const { error } = await supabase
    .from("store_settings")
    .update({ marketplace_profile })
    .eq("store_id", store.id);

  if (error) return { success: false, error: error.message };

  await syncStoreBranding(store.id, marketplace_profile, general.data.description);

  revalidatePath("/merchant/store");
  revalidatePath("/merchant/store/builder");
  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/stores/${store.slug}`);
  if (slugChanged) {
    revalidatePath(`/marketplace/stores/${general.data.slug}`);
  }

  return { success: true };
}
