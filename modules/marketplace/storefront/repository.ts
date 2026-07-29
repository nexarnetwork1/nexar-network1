import { createClient } from "@/lib/supabase/server";
import { getStoreCategories } from "@/modules/catalog/repository";
import type {
  ProductReview,
  StoreReview,
  StoreTrustMetrics,
} from "@/types";
import type {
  ShopFilters,
  ShopSearchResult,
  StoreCollection,
  StorefrontPageData,
  StorefrontProduct,
  StorefrontProductDetail,
  StorefrontStore,
  StoreBranding,
  ProductVariant,
} from "./types";

const PRODUCT_SELECT =
  "*, store:stores!inner(id, name, slug, logo_url, status, mode), brand:brands(name, slug), marketplace_category:marketplace_categories(name, slug)";

function mapProduct(row: Record<string, unknown>): StorefrontProduct {
  const store = row.store as StorefrontProduct["store"];
  const brand = row.brand as { name: string; slug: string } | null;
  const category = row.marketplace_category as { name: string; slug: string } | null;
  return {
    ...(row as StorefrontProduct),
    store,
    brand_name: brand?.name ?? null,
    marketplace_category_name: category?.name ?? null,
  };
}

async function getFollowerCount(storeId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("store_followers")
    .select("*", { count: "exact", head: true })
    .eq("store_id", storeId);
  return count ?? 0;
}

async function isFollowingStore(storeId: string, customerId?: string): Promise<boolean> {
  if (!customerId) return false;
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_followers")
    .select("store_id")
    .eq("store_id", storeId)
    .eq("customer_id", customerId)
    .maybeSingle();
  return Boolean(data);
}

async function getProductRatings(productIds: string[]) {
  if (!productIds.length) return new Map<string, { avg: number; count: number }>();
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_reviews")
    .select("product_id, rating")
    .in("product_id", productIds)
    .eq("status", "approved");

  const map = new Map<string, { total: number; count: number }>();
  for (const row of data ?? []) {
    const id = row.product_id as string;
    const current = map.get(id) ?? { total: 0, count: 0 };
    current.total += Number(row.rating);
    current.count += 1;
    map.set(id, current);
  }

  return new Map(
    [...map.entries()].map(([id, { total, count }]) => [
      id,
      { avg: Math.round((total / count) * 10) / 10, count },
    ]),
  );
}

export async function getStoreBranding(storeId: string): Promise<StoreBranding | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_branding")
    .select("*")
    .eq("store_id", storeId)
    .maybeSingle();
  if (!data) return null;
  return {
    ...data,
    social_links: (data.social_links as Record<string, string>) ?? {},
  } as StoreBranding;
}

export async function getStorefrontBySlug(
  slug: string,
  customerId?: string,
): Promise<StorefrontStore | null> {
  const supabase = await createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .eq("mode", "marketplace")
    .maybeSingle();

  if (!store) return null;

  const [settings, branding, trustRow, verification, followerCount, productCount, following] =
    await Promise.all([
      supabase.from("store_settings").select("*").eq("store_id", store.id).maybeSingle(),
      getStoreBranding(store.id),
      supabase.from("store_trust_metrics").select("*").eq("store_id", store.id).maybeSingle(),
      supabase
        .from("store_verifications")
        .select("status")
        .eq("store_id", store.id)
        .eq("status", "verified")
        .maybeSingle(),
      getFollowerCount(store.id),
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("store_id", store.id)
        .eq("is_active", true),
      isFollowingStore(store.id, customerId),
    ]);

  return {
    ...(store as StorefrontStore),
    settings: settings.data as StorefrontStore["settings"],
    branding,
    trust: trustRow.data as StoreTrustMetrics | null,
    is_verified: Boolean(verification.data),
    follower_count: followerCount,
    product_count: productCount.count ?? 0,
    is_following: following,
  };
}

async function listStoreProductsInternal(
  storeId: string,
  opts: { limit?: number; sort?: string; categoryId?: string } = {},
): Promise<StorefrontProduct[]> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("store_id", storeId)
    .eq("is_active", true)
    .eq("store.status", "active")
    .eq("store.mode", "marketplace");

  if (opts.categoryId) {
    query = query.eq("category_id", opts.categoryId);
  }

  switch (opts.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data } = await query.limit(opts.limit ?? 12);
  const products = (data ?? []).map((row) => mapProduct(row as Record<string, unknown>));
  const ratings = await getProductRatings(products.map((p) => p.id));
  return products.map((p) => ({
    ...p,
    avg_rating: ratings.get(p.id)?.avg ?? 0,
    review_count: ratings.get(p.id)?.count ?? 0,
  }));
}

async function getBestSellers(storeId: string, limit = 8): Promise<StorefrontProduct[]> {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id")
    .eq("store_id", storeId)
    .eq("status", "paid");

  const orderIds = (orders ?? []).map((o) => o.id as string);
  if (!orderIds.length) {
    return listStoreProductsInternal(storeId, { limit, sort: "newest" });
  }

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("product_id")
    .in("order_id", orderIds);

  const counts = new Map<string, number>();
  for (const row of orderItems ?? []) {
    const pid = row.product_id as string;
    if (pid) counts.set(pid, (counts.get(pid) ?? 0) + 1);
  }

  const topIds = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  if (!topIds.length) {
    return listStoreProductsInternal(storeId, { limit, sort: "newest" });
  }

  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .in("id", topIds)
    .eq("is_active", true);

  const byId = new Map((data ?? []).map((row) => [row.id as string, mapProduct(row as Record<string, unknown>)]));
  return topIds.map((id) => byId.get(id)).filter(Boolean) as StorefrontProduct[];
}

async function getFlashDealProducts(storeId: string, limit = 8): Promise<StorefrontProduct[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data: promo } = await supabase
    .from("merchant_promotions")
    .select("id")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .lte("starts_at", now)
    .gte("expires_at", now)
    .limit(1)
    .maybeSingle();

  if (!promo) return [];

  return listStoreProductsInternal(storeId, { limit, sort: "newest" });
}

export async function getStoreCollections(storeId: string): Promise<StoreCollection[]> {
  const categories = await getStoreCategories(storeId);
  const [newArrivals, bestSellers, flashDeals, trending] = await Promise.all([
    listStoreProductsInternal(storeId, { limit: 8, sort: "newest" }),
    getBestSellers(storeId, 8),
    getFlashDealProducts(storeId, 8),
    getBestSellers(storeId, 8),
  ]);

  const collections: StoreCollection[] = [];

  for (const cat of categories) {
    const products = await listStoreProductsInternal(storeId, {
      limit: 8,
      categoryId: cat.id,
    });
    if (products.length) {
      collections.push({
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        products,
        kind: "category",
      });
    }
  }

  if (newArrivals.length) {
    collections.push({
      id: "new-arrivals",
      slug: "new-arrivals",
      name: "New Arrivals",
      products: newArrivals,
      kind: "new_arrivals",
    });
  }
  if (bestSellers.length) {
    collections.push({
      id: "best-sellers",
      slug: "best-sellers",
      name: "Best Sellers",
      products: bestSellers,
      kind: "best_sellers",
    });
  }
  if (flashDeals.length) {
    collections.push({
      id: "flash-deals",
      slug: "flash-deals",
      name: "Flash Deals",
      products: flashDeals,
      kind: "flash_deals",
    });
  }
  if (trending.length) {
    collections.push({
      id: "trending",
      slug: "trending",
      name: "Trending",
      products: trending,
      kind: "trending",
    });
  }

  return collections;
}

export async function getStoreReviews(storeId: string, limit = 12): Promise<StoreReview[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_reviews")
    .select("*, customer:profiles(id, full_name, avatar_url)")
    .eq("store_id", storeId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as StoreReview[];
}

export async function getStorefrontPageData(
  slug: string,
  customerId?: string,
): Promise<StorefrontPageData | null> {
  const store = await getStorefrontBySlug(slug, customerId);
  if (!store) return null;

  const [collections, featured_products, store_reviews] = await Promise.all([
    getStoreCollections(store.id),
    listStoreProductsInternal(store.id, { limit: 8, sort: "newest" }),
    getStoreReviews(store.id),
  ]);

  return {
    store,
    collections,
    featured_products,
    store_reviews,
    profile: store.settings?.marketplace_profile ?? {},
  };
}

export async function searchShop(filters: ShopFilters): Promise<ShopSearchResult> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(filters.limit ?? 24, 48);
  const offset = (page - 1) * limit;

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" })
    .eq("is_active", true)
    .eq("store.status", "active")
    .eq("store.mode", "marketplace");

  if (filters.storeSlug) query = query.eq("store.slug", filters.storeSlug);
  if (filters.query?.trim()) query = query.ilike("name", `%${filters.query.trim()}%`);
  if (filters.brandId) query = query.eq("brand_id", filters.brandId);
  if (filters.minPrice != null) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice != null) query = query.lte("price", filters.maxPrice);
  if (filters.inStock) query = query.gt("stock", 0);

  if (filters.categorySlug) {
    const { data: cat } = await supabase
      .from("marketplace_categories")
      .select("id")
      .eq("slug", filters.categorySlug)
      .maybeSingle();
    if (cat) query = query.eq("marketplace_category_id", cat.id);
  }

  switch (filters.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "bestsellers":
    case "rating":
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, count } = await query.range(offset, offset + limit - 1);
  let items = (data ?? []).map((row) => mapProduct(row as Record<string, unknown>));
  const ratings = await getProductRatings(items.map((p) => p.id));
  items = items.map((p) => ({
    ...p,
    avg_rating: ratings.get(p.id)?.avg ?? 0,
    review_count: ratings.get(p.id)?.count ?? 0,
  }));

  if (filters.minRating != null && filters.minRating > 0) {
    items = items.filter((p) => (p.avg_rating ?? 0) >= filters.minRating!);
  }

  const [{ data: categories }, { data: brands }] = await Promise.all([
    supabase.from("marketplace_categories").select("id, name, slug").eq("is_active", true),
    supabase.from("brands").select("id, name, slug").eq("status", "approved"),
  ]);

  return {
    items,
    total: count ?? 0,
    page,
    limit,
    filters: {
      categories: (categories ?? []).map((c) => ({
        id: c.id as string,
        name: c.name as string,
        slug: c.slug as string,
        count: 0,
      })),
      brands: (brands ?? []).map((b) => ({
        id: b.id as string,
        name: b.name as string,
        slug: b.slug as string,
        count: 0,
      })),
    },
  };
}

export async function getProductDetail(
  handle: string,
  customerId?: string,
): Promise<StorefrontProductDetail | null> {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .eq("store.status", "active")
    .eq("store.mode", "marketplace");

  const isUuid = /^[0-9a-f-]{36}$/i.test(handle);
  query = isUuid ? query.eq("id", handle) : query.eq("slug", handle);

  const { data: productRow } = await query.maybeSingle();
  if (!productRow) return null;

  const product = mapProduct(productRow as Record<string, unknown>);

  const [images, variants, reviews, wishlist, related] = await Promise.all([
    supabase
      .from("product_images")
      .select("*")
      .eq("product_id", product.id)
      .order("sort_order"),
    supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", product.id)
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("product_reviews")
      .select("*, customer:profiles(id, full_name, avatar_url)")
      .eq("product_id", product.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(20),
    customerId
      ? supabase
          .from("wishlist_items")
          .select("product_id")
          .eq("customer_id", customerId)
          .eq("product_id", product.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("store_id", product.store_id)
      .eq("is_active", true)
      .neq("id", product.id)
      .limit(4),
  ]);

  const ratings = await getProductRatings([product.id]);
  const rating = ratings.get(product.id);

  return {
    ...product,
    avg_rating: rating?.avg ?? 0,
    review_count: rating?.count ?? 0,
    images: (images.data ?? []) as StorefrontProductDetail["images"],
    variants: (variants.data ?? []) as ProductVariant[],
    reviews: (reviews.data ?? []) as ProductReview[],
    related_products: (related.data ?? []).map((row) =>
      mapProduct(row as Record<string, unknown>),
    ),
    in_wishlist: Boolean(wishlist.data),
  };
}

export async function getRecentlyViewedProducts(
  customerId: string,
  limit = 8,
): Promise<StorefrontProduct[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("recently_viewed_products")
    .select("product_id")
    .eq("customer_id", customerId)
    .order("viewed_at", { ascending: false })
    .limit(limit);

  const ids = (data ?? []).map((r) => r.product_id as string);
  if (!ids.length) return [];

  const { data: products } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .in("id", ids)
    .eq("is_active", true);

  const byId = new Map(
    (products ?? []).map((row) => [row.id as string, mapProduct(row as Record<string, unknown>)]),
  );
  return ids.map((id) => byId.get(id)).filter(Boolean) as StorefrontProduct[];
}
