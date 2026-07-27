import { createClient } from "@/lib/supabase/server";
import type { WishlistItem } from "@/types";

export async function getWishlistItems(customerId: string): Promise<WishlistItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("wishlist_items")
    .select("*, product:products(*, store:stores(id, name, slug, logo_url))")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  return (data ?? []) as WishlistItem[];
}

export async function getWishlistProductIds(customerId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("wishlist_items")
    .select("product_id")
    .eq("customer_id", customerId);

  return (data ?? []).map((d) => d.product_id as string);
}

export async function trackRecentlyViewed(customerId: string, productId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("recently_viewed_products").upsert(
    { customer_id: customerId, product_id: productId, viewed_at: new Date().toISOString() },
    { onConflict: "customer_id,product_id" }
  );
}

export async function getRecentlyViewedProducts(customerId: string, limit = 8) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("recently_viewed_products")
    .select("product:products(*, store:stores(id, name, slug, logo_url))")
    .eq("customer_id", customerId)
    .order("viewed_at", { ascending: false })
    .limit(limit);

  return (data ?? [])
    .map((row) => row.product)
    .filter(Boolean);
}
