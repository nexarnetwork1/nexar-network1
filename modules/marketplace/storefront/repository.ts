import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ShopFilters,
  ShopSearchResult,
  StorefrontProduct,
  StorefrontProductDetail,
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

async function getProductRatings(productIds: string[]) {
  if (!productIds.length) return new Map<string, { avg: number; count: number }>();
  const supabase = createAdminClient();
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
  const supabase = createAdminClient();
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

export async function searchShop(filters: ShopFilters): Promise<ShopSearchResult> {
  const supabase = createAdminClient();
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
  const supabase = createAdminClient();

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
    reviews: (reviews.data ?? []) as StorefrontProductDetail["reviews"],
    related_products: (related.data ?? []).map((row) =>
      mapProduct(row as Record<string, unknown>),
    ),
    in_wishlist: Boolean(wishlist.data),
  };
}
