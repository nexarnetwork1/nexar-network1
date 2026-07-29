import { createClient } from "@/lib/supabase/server";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import type { ProductWithStore } from "@/types";

export type MarketplaceCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
};

type ProductRowWithImages = ProductWithStore & {
  images?: { url: string; is_primary: boolean; sort_order: number }[];
};

function mapProducts(rows: ProductRowWithImages[]): ProductWithStore[] {
  return rows.map(({ images, ...product }) => {
    const primary = images?.find((image) => image.is_primary);
    const image_url = primary?.url ?? images?.[0]?.url ?? product.image_url;
    return { ...product, image_url };
  });
}

function buildBaseProductQuery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  limit: number
) {
  return supabase
    .from("products")
    .select(
      "*, store:stores!inner(id, name, slug, logo_url, status, mode), images:product_images(url, is_primary, sort_order)",
      { count: "exact" }
    )
    .eq("is_active", true)
    .eq("store.status", "active")
    .eq("store.mode", "marketplace")
    .gt("stock", 0)
    .limit(limit);
}

export async function getPlatformMarketplaceCategories(): Promise<MarketplaceCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("marketplace_categories")
    .select("id, name, slug, description, icon, sort_order")
    .eq("is_active", true)
    .order("sort_order");

  if (error) return [];
  return (data ?? []) as MarketplaceCategory[];
}

export async function getFeaturedMarketplaceProducts(limit = 8): Promise<ProductWithStore[]> {
  const supabase = await createClient();
  const { data: featuredStores } = await supabase
    .from("store_settings")
    .select("store_id, marketplace_profile")
    .not("marketplace_profile", "is", null);

  const featuredStoreIds = (featuredStores ?? [])
    .filter((row) => {
      const profile = row.marketplace_profile as { featured?: boolean } | null;
      return profile?.featured === true;
    })
    .map((row) => row.store_id as string);

  let query = buildBaseProductQuery(supabase, limit);

  if (featuredStoreIds.length > 0) {
    query = query.in("store_id", featuredStoreIds);
  } else {
    query = query.eq("is_on_sale", true);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) return [];
  return mapProducts((data ?? []) as ProductRowWithImages[]);
}

export async function getNewMarketplaceProducts(limit = 8): Promise<ProductWithStore[]> {
  const supabase = await createClient();
  const { data, error } = await buildBaseProductQuery(supabase, limit).order("created_at", {
    ascending: false,
  });
  if (error) return [];
  return mapProducts((data ?? []) as ProductRowWithImages[]);
}

export async function getBestSellingMarketplaceProducts(limit = 8): Promise<ProductWithStore[]> {
  const admin = tryCreateAdminClient();
  if (!admin) {
    return getNewMarketplaceProducts(limit);
  }

  const { data: orderItems } = await admin
    .from("order_items")
    .select("product_id")
    .not("product_id", "is", null)
    .limit(500);

  const counts = new Map<string, number>();
  for (const item of orderItems ?? []) {
    if (!item.product_id) continue;
    counts.set(item.product_id, (counts.get(item.product_id) ?? 0) + 1);
  }

  const topIds = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  if (topIds.length === 0) {
    return getNewMarketplaceProducts(limit);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "*, store:stores!inner(id, name, slug, logo_url, status, mode), images:product_images(url, is_primary, sort_order)"
    )
    .eq("is_active", true)
    .eq("store.status", "active")
    .eq("store.mode", "marketplace")
    .in("id", topIds);

  if (error || !data?.length) return getNewMarketplaceProducts(limit);

  const byId = new Map(mapProducts(data as ProductRowWithImages[]).map((p) => [p.id, p]));
  return topIds.map((id) => byId.get(id)).filter(Boolean) as ProductWithStore[];
}

export async function getTrendingMarketplaceProducts(limit = 8): Promise<ProductWithStore[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 7 * 86400000).toISOString();

  const { data: recentViews } = await supabase
    .from("recently_viewed_products")
    .select("product_id")
    .gte("viewed_at", since)
    .limit(300);

  const counts = new Map<string, number>();
  for (const row of recentViews ?? []) {
    counts.set(row.product_id, (counts.get(row.product_id) ?? 0) + 1);
  }

  const topIds = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  if (topIds.length === 0) {
    return getBestSellingMarketplaceProducts(limit);
  }

  const { data, error } = await supabase
    .from("products")
    .select(
      "*, store:stores!inner(id, name, slug, logo_url, status, mode), images:product_images(url, is_primary, sort_order)"
    )
    .eq("is_active", true)
    .eq("store.status", "active")
    .eq("store.mode", "marketplace")
    .in("id", topIds);

  if (error || !data?.length) return getBestSellingMarketplaceProducts(limit);

  const byId = new Map(mapProducts(data as ProductRowWithImages[]).map((p) => [p.id, p]));
  return topIds.map((id) => byId.get(id)).filter(Boolean) as ProductWithStore[];
}

export async function getMarketplaceProductsByIds(
  ids: string[]
): Promise<ProductWithStore[]> {
  if (ids.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "*, store:stores!inner(id, name, slug, logo_url, status, mode), images:product_images(url, is_primary, sort_order)"
    )
    .eq("is_active", true)
    .eq("store.status", "active")
    .eq("store.mode", "marketplace")
    .in("id", ids);

  if (error || !data?.length) return [];

  const byId = new Map(
    mapProducts(data as ProductRowWithImages[]).map((product) => [product.id, product])
  );
  return ids.map((id) => byId.get(id)).filter(Boolean) as ProductWithStore[];
}

export async function getCustomerRecentlyViewedMarketplaceProducts(
  customerId: string,
  limit = 8
): Promise<ProductWithStore[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recently_viewed_products")
    .select("product_id")
    .eq("customer_id", customerId)
    .order("viewed_at", { ascending: false })
    .limit(limit);

  if (error || !data?.length) return [];

  return getMarketplaceProductsByIds(data.map((row) => row.product_id));
}

export async function getMarketplaceHomeData() {
  const [categories, featured, trending, newest, bestSellers] = await Promise.all([
    getPlatformMarketplaceCategories(),
    getFeaturedMarketplaceProducts(8),
    getTrendingMarketplaceProducts(8),
    getNewMarketplaceProducts(8),
    getBestSellingMarketplaceProducts(8),
  ]);

  return { categories, featured, trending, newest, bestSellers };
}
