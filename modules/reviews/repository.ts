import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProductReview, StoreReview } from "@/types";

export async function getProductReviews(
  productId: string,
  limit = 20
): Promise<ProductReview[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_reviews")
    .select("*, customer:profiles!product_reviews_customer_id_fkey(id, full_name, avatar_url)")
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as ProductReview[]).map(normalizeReviewImages);
}

export async function getStoreReviews(
  storeId: string,
  limit = 20
): Promise<StoreReview[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_reviews")
    .select("*, customer:profiles!store_reviews_customer_id_fkey(id, full_name, avatar_url)")
    .eq("store_id", storeId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as StoreReview[]).map(normalizeReviewImages);
}

export async function getProductRatingSummary(productId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_reviews")
    .select("rating")
    .eq("product_id", productId)
    .eq("status", "approved");

  const ratings = (data ?? []).map((r) => r.rating as number);
  if (!ratings.length) return { avg: 0, count: 0 };
  return {
    avg: Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)),
    count: ratings.length,
  };
}

export async function getStoreRatingSummary(storeId: string) {
  const supabase = await createClient();
  const [{ data: productReviews }, { data: storeReviews }] = await Promise.all([
    supabase
      .from("product_reviews")
      .select("rating")
      .eq("store_id", storeId)
      .eq("status", "approved"),
    supabase
      .from("store_reviews")
      .select("rating")
      .eq("store_id", storeId)
      .eq("status", "approved"),
  ]);

  const ratings = [
    ...(productReviews ?? []).map((r) => r.rating as number),
    ...(storeReviews ?? []).map((r) => r.rating as number),
  ];
  if (!ratings.length) return { avg: 0, count: 0 };
  return {
    avg: Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)),
    count: ratings.length,
  };
}

export async function getAllReviewsForModeration(limit = 50) {
  const admin = createAdminClient();
  const [{ data: productReviews }, { data: storeReviews }] = await Promise.all([
    admin
      .from("product_reviews")
      .select("*, customer:profiles!product_reviews_customer_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(limit),
    admin
      .from("store_reviews")
      .select("*, customer:profiles!store_reviews_customer_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  return {
    productReviews: (productReviews ?? []) as ProductReview[],
    storeReviews: (storeReviews ?? []) as StoreReview[],
  };
}

function normalizeReviewImages<T extends { images: unknown }>(review: T): T {
  return {
    ...review,
    images: Array.isArray(review.images) ? (review.images as string[]) : [],
  };
}
