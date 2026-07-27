"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole, requireSuperAdmin } from "@/modules/users/repository";
import { dispatchNotification } from "@/modules/notifications/dispatch";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createProductReviewSchema,
  createStoreReviewSchema,
  merchantReplySchema,
} from "./validators";
import type { ActionResult } from "@/modules/auth/actions";

export async function createProductReviewAction(formData: FormData): Promise<ActionResult> {
  const profile = await requireRole(["customer"]);
  const imagesRaw = formData.get("images");
  const images =
    typeof imagesRaw === "string" && imagesRaw
      ? imagesRaw.split(",").filter(Boolean)
      : [];

  const parsed = createProductReviewSchema.safeParse({
    productId: formData.get("productId"),
    storeId: formData.get("storeId"),
    rating: formData.get("rating"),
    title: formData.get("title") || undefined,
    body: formData.get("body"),
    images,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("customer_id", profile.id)
    .eq("status", "paid")
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("product_reviews").insert({
    product_id: parsed.data.productId,
    store_id: parsed.data.storeId,
    customer_id: profile.id,
    order_id: order?.id ?? null,
    rating: parsed.data.rating,
    title: parsed.data.title ?? null,
    body: parsed.data.body,
    images: parsed.data.images ?? [],
    is_verified_purchase: Boolean(order),
  });

  if (error) return { success: false, error: error.message };

  const admin = createAdminClient();
  const { data: store } = await admin
    .from("stores")
    .select("owner_id, name")
    .eq("id", parsed.data.storeId)
    .single();

  if (store?.owner_id) {
    await dispatchNotification({
      event: "new_review",
      userId: store.owner_id,
      type: "system",
      title: "New product review",
      body: `A customer left a ${parsed.data.rating}-star review on your store.`,
      metadata: { product_id: parsed.data.productId, store_id: parsed.data.storeId },
    });
  }

  revalidatePath(`/customer/browse/${parsed.data.productId}`);
  return { success: true };
}

export async function createStoreReviewAction(formData: FormData): Promise<ActionResult> {
  const profile = await requireRole(["customer"]);
  const imagesRaw = formData.get("images");
  const images =
    typeof imagesRaw === "string" && imagesRaw ? imagesRaw.split(",").filter(Boolean) : [];

  const parsed = createStoreReviewSchema.safeParse({
    storeId: formData.get("storeId"),
    rating: formData.get("rating"),
    title: formData.get("title") || undefined,
    body: formData.get("body"),
    images,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("store_reviews").insert({
    store_id: parsed.data.storeId,
    customer_id: profile.id,
    rating: parsed.data.rating,
    title: parsed.data.title ?? null,
    body: parsed.data.body,
    images: parsed.data.images ?? [],
  });

  if (error) return { success: false, error: error.message };

  revalidatePath(`/store`);
  return { success: true };
}

export async function merchantReplyReviewAction(formData: FormData): Promise<ActionResult> {
  const profile = await requireRole(["merchant"]);
  const parsed = merchantReplySchema.safeParse({
    reviewId: formData.get("reviewId"),
    reviewType: formData.get("reviewType"),
    reply: formData.get("reply"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const table = parsed.data.reviewType === "product" ? "product_reviews" : "store_reviews";
  const supabase = await createClient();

  const { data: review } = await supabase
    .from(table)
    .select("store_id")
    .eq("id", parsed.data.reviewId)
    .single();

  if (!review) return { success: false, error: "Review not found" };

  const { data: store } = await supabase
    .from("stores")
    .select("owner_id")
    .eq("id", review.store_id)
    .single();

  if (store?.owner_id !== profile.id) {
    return { success: false, error: "Not authorized" };
  }

  const { error } = await supabase
    .from(table)
    .update({
      merchant_reply: parsed.data.reply,
      merchant_reply_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.reviewId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/merchant");
  return { success: true };
}

export async function moderateReviewAction(formData: FormData): Promise<ActionResult> {
  await requireSuperAdmin();
  const reviewId = formData.get("reviewId");
  const reviewType = formData.get("reviewType");
  const status = formData.get("status");

  if (typeof reviewId !== "string" || typeof reviewType !== "string" || typeof status !== "string") {
    return { success: false, error: "Invalid input" };
  }

  const table = reviewType === "product" ? "product_reviews" : "store_reviews";
  const admin = createAdminClient();
  const { error } = await admin.from(table).update({ status }).eq("id", reviewId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/reviews");
  return { success: true };
}
