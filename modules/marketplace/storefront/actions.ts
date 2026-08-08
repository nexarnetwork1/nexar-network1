"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole, getCurrentProfile } from "@/modules/users/repository";
import { wishlistRepository } from "@/modules/marketplace/wishlist/infrastructure/supabase-wishlist-repository";
import type { ActionResult } from "@/modules/auth/actions";

const reviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  title: z.string().max(200).optional(),
  body: z.string().min(10).max(5000),
  productId: z.string().uuid().optional(),
});

export async function toggleWishlistAction(productId: string): Promise<ActionResult & { inWishlist?: boolean }> {
  const profile = await requireRole(["customer", "merchant"]);
  const ids = await wishlistRepository.listProductIds(profile.id);
  const has = ids.includes(productId);

  if (has) {
    await wishlistRepository.removeProduct(profile.id, productId);
    return { success: true, inWishlist: false };
  }

  await wishlistRepository.addProduct(profile.id, productId);
  return { success: true, inWishlist: true };
}

export async function submitProductReviewAction(formData: FormData): Promise<ActionResult> {
  const profile = await requireRole(["customer"]);
  const parsed = reviewSchema.safeParse({
    rating: formData.get("rating"),
    title: formData.get("title") || undefined,
    body: formData.get("body"),
    productId: formData.get("productId"),
  });
  if (!parsed.success || !parsed.data.productId) {
    return { success: false, error: parsed.error?.issues[0]?.message ?? "Invalid review" };
  }

  const supabase = createAdminClient();
  const { data: product } = await supabase
    .from("products")
    .select("store_id")
    .eq("id", parsed.data.productId)
    .maybeSingle();

  if (!product) return { success: false, error: "Product not found" };

  const { data: order } = await supabase
    .from("order_items")
    .select("orders!inner(customer_id, status)")
    .eq("product_id", parsed.data.productId)
    .eq("orders.customer_id", profile.id)
    .eq("orders.status", "paid")
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("product_reviews").insert({
    product_id: parsed.data.productId,
    store_id: product.store_id,
    customer_id: profile.id,
    rating: parsed.data.rating,
    title: parsed.data.title ?? null,
    body: parsed.data.body,
    images: [],
    status: "approved",
    is_verified_purchase: Boolean(order),
    helpful_count: 0,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/marketplace");
  return { success: true };
}

export async function recordProductViewAction(productId: string): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const supabase = createAdminClient();
  await supabase.from("recently_viewed_products").upsert(
    {
      customer_id: profile.id,
      product_id: productId,
      viewed_at: new Date().toISOString(),
    },
    { onConflict: "customer_id,product_id" },
  );
}
