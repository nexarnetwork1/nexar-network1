import { createClient } from "@/lib/supabase/server";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import type { ProductWithStore } from "@/types";

export async function getSimilarProducts(
  productId: string,
  categoryId: string | null,
  storeId: string,
  limit = 4
): Promise<ProductWithStore[]> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("*, store:stores(id, name, slug, logo_url)")
    .eq("is_active", true)
    .neq("id", productId)
    .limit(limit);

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  } else {
    query = query.eq("store_id", storeId);
  }

  const { data } = await query;
  return (data ?? []) as ProductWithStore[];
}

export async function getRecommendedProducts(
  customerId: string | null,
  limit = 8
): Promise<ProductWithStore[]> {
  const supabase = await createClient();

  if (customerId) {
    const { data: recent } = await supabase
      .from("recently_viewed_products")
      .select("product:products(category_id, store_id)")
      .eq("customer_id", customerId)
      .order("viewed_at", { ascending: false })
      .limit(3);

    const categoryIds = [
      ...new Set(
        (recent ?? [])
          .map((r) => {
            const product = r.product as { category_id?: string } | null;
            return product?.category_id;
          })
          .filter(Boolean)
      ),
    ] as string[];

    if (categoryIds.length) {
      const { data } = await supabase
        .from("products")
        .select("*, store:stores(id, name, slug, logo_url)")
        .eq("is_active", true)
        .in("category_id", categoryIds)
        .gt("stock", 0)
        .limit(limit);

      if (data?.length) return data as ProductWithStore[];
    }
  }

  const admin = tryCreateAdminClient();
  if (!admin) {
    const { data } = await supabase
      .from("products")
      .select("*, store:stores(id, name, slug, logo_url)")
      .eq("is_active", true)
      .gt("stock", 0)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as ProductWithStore[];
  }

  const { data: topOrderItems } = await admin
    .from("order_items")
    .select("product_id")
    .not("product_id", "is", null)
    .limit(100);

  const counts = new Map<string, number>();
  for (const item of topOrderItems ?? []) {
    if (!item.product_id) continue;
    counts.set(item.product_id, (counts.get(item.product_id) ?? 0) + 1);
  }

  const topIds = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  if (!topIds.length) {
    const { data } = await supabase
      .from("products")
      .select("*, store:stores(id, name, slug, logo_url)")
      .eq("is_active", true)
      .gt("stock", 0)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as ProductWithStore[];
  }

  const { data } = await supabase
    .from("products")
    .select("*, store:stores(id, name, slug, logo_url)")
    .in("id", topIds)
    .eq("is_active", true);

  return (data ?? []) as ProductWithStore[];
}

export async function getFrequentlyBoughtTogether(
  productId: string,
  limit = 4
): Promise<ProductWithStore[]> {
  const admin = tryCreateAdminClient();
  if (!admin) return [];

  const { data: orderItems } = await admin
    .from("order_items")
    .select("order_id")
    .eq("product_id", productId);

  const orderIds = (orderItems ?? []).map((i) => i.order_id);
  if (!orderIds.length) return [];

  const { data: coItems } = await admin
    .from("order_items")
    .select("product_id")
    .in("order_id", orderIds)
    .neq("product_id", productId)
    .not("product_id", "is", null);

  const counts = new Map<string, number>();
  for (const item of coItems ?? []) {
    if (!item.product_id) continue;
    counts.set(item.product_id, (counts.get(item.product_id) ?? 0) + 1);
  }

  const topIds = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  if (!topIds.length) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, store:stores(id, name, slug, logo_url)")
    .in("id", topIds)
    .eq("is_active", true);

  return (data ?? []) as ProductWithStore[];
}

export async function getStoreTrustMetrics(storeId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_trust_metrics")
    .select("*")
    .eq("store_id", storeId)
    .maybeSingle();

  return data ?? {
    store_id: storeId,
    years_active: 0,
    total_orders: 0,
    total_reviews: 0,
    avg_rating: 0,
    response_rate: 0,
    avg_response_hours: null,
  };
}
