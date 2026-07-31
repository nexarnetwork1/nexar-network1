import "server-only";

import { createClient } from "@/lib/supabase/server";
import { listApprovedBrands } from "@/modules/marketplace/brands";
import {
  getLiveCommerceMetrics,
  getMarketplaceStatistics,
} from "@/modules/marketplace/statistics";
import { getActiveTickerAnnouncements } from "@/modules/ticker/repository";
import type {
  CommerceActivityEvent,
  CommerceBrand,
  CommerceCategory,
  CommerceCountry,
  CommerceFaqItem,
  CommerceHomeData,
  CommerceMerchantNetworkItem,
  CommerceProduct,
  CommerceStore,
  CommerceSubscriptionPlan,
  LiveMetricsPayload,
  MarketplaceStatisticsPayload,
} from "./types";

function normalizeRpcProduct(raw: Record<string, unknown>): CommerceProduct | null {
  const id = typeof raw.id === "string" ? raw.id : undefined;
  const name = typeof raw.name === "string" ? raw.name : undefined;
  if (!id || !name) return null;

  return {
    id,
    name,
    slug: typeof raw.slug === "string" && raw.slug.length > 0 ? raw.slug : id,
    price: Number(raw.price ?? 0),
    currency: typeof raw.currency === "string" ? raw.currency : "USD",
    image_url: typeof raw.image_url === "string" ? raw.image_url : null,
    created_at: typeof raw.created_at === "string" ? raw.created_at : undefined,
    store_id: typeof raw.store_id === "string" ? raw.store_id : undefined,
    store_name: typeof raw.store_name === "string" ? raw.store_name : undefined,
    store_slug: typeof raw.store_slug === "string" ? raw.store_slug : undefined,
    units_sold: raw.units_sold != null ? Number(raw.units_sold) : undefined,
    revenue: raw.revenue != null ? Number(raw.revenue) : undefined,
  };
}

function normalizeRpcStore(raw: Record<string, unknown>): CommerceStore | null {
  const id = typeof raw.id === "string" ? raw.id : undefined;
  const name = typeof raw.name === "string" ? raw.name : undefined;
  const slug = typeof raw.slug === "string" ? raw.slug : undefined;
  if (!id || !name || !slug) return null;

  return {
    id,
    name,
    slug,
    logo_url: typeof raw.logo_url === "string" ? raw.logo_url : null,
    banner_url: typeof raw.banner_url === "string" ? raw.banner_url : null,
    tagline: typeof raw.tagline === "string" ? raw.tagline : null,
    featured: raw.featured === true,
  };
}

function normalizeRpcBrand(raw: Record<string, unknown>): CommerceBrand | null {
  const id = typeof raw.id === "string" ? raw.id : undefined;
  const name = typeof raw.name === "string" ? raw.name : undefined;
  const slug = typeof raw.slug === "string" ? raw.slug : undefined;
  if (!id || !name || !slug) return null;

  return {
    id,
    name,
    slug,
    logo_url: typeof raw.logo_url === "string" ? raw.logo_url : null,
    store_id: typeof raw.store_id === "string" ? raw.store_id : undefined,
    approved_at: typeof raw.approved_at === "string" ? raw.approved_at : null,
  };
}

function normalizeRpcProducts(rows: unknown[]): CommerceProduct[] {
  return rows
    .filter((row): row is Record<string, unknown> => !!row && typeof row === "object")
    .map(normalizeRpcProduct)
    .filter((row): row is CommerceProduct => row !== null);
}

function normalizeRpcStores(rows: unknown[]): CommerceStore[] {
  return rows
    .filter((row): row is Record<string, unknown> => !!row && typeof row === "object")
    .map(normalizeRpcStore)
    .filter((row): row is CommerceStore => row !== null);
}

function parseStoreRelation(
  store: unknown,
): { id?: string; name: string; slug: string } | null {
  if (!store || typeof store !== "object") return null;
  if (Array.isArray(store)) {
    const first = store[0];
    return first && typeof first === "object"
      ? (first as { id?: string; name: string; slug: string })
      : null;
  }
  return store as { id?: string; name: string; slug: string };
}

async function loadCategories(): Promise<CommerceCategory[]> {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("marketplace_categories")
    .select("id, name, slug, description, icon, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (!categories?.length) return [];

  const { data: counts } = await supabase
    .from("products")
    .select("marketplace_category_id")
    .eq("is_active", true)
    .not("marketplace_category_id", "is", null);

  const countMap = new Map<string, number>();
  for (const row of counts ?? []) {
    const id = row.marketplace_category_id as string;
    countMap.set(id, (countMap.get(id) ?? 0) + 1);
  }

  return categories.map((c) => ({
    ...c,
    product_count: countMap.get(c.id) ?? 0,
  }));
}

async function loadSubscriptionPlans(): Promise<CommerceSubscriptionPlan[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscription_plans")
    .select(
      "id, name, description, price, currency, interval_days, store_id, store:stores(name, slug)",
    )
    .eq("is_active", true)
    .order("price", { ascending: true })
    .limit(12);

  return (data ?? []).map((row) => {
    const store = parseStoreRelation(row.store);
    return {
      id: row.id as string,
      name: row.name as string,
      description: row.description as string | null,
      price: Number(row.price),
      currency: row.currency as string,
      interval_days: row.interval_days as number,
      store_id: row.store_id as string,
      store_name: store?.name,
      store_slug: store?.slug,
    };
  });
}

async function loadActivity(limit = 40): Promise<CommerceActivityEvent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("commerce_activity_events")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as CommerceActivityEvent[];
}

async function loadCountries(): Promise<CommerceCountry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("countries")
    .select("code, name, region")
    .eq("is_active", true)
    .order("name");

  return (data ?? []) as CommerceCountry[];
}

async function loadActiveCountryCodes(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("commerce_analytics_events")
    .select("country_code")
    .not("country_code", "is", null)
    .limit(500);

  const codes = new Set<string>();
  for (const row of data ?? []) {
    if (row.country_code) codes.add(row.country_code as string);
  }
  return [...codes];
}

async function enrichFeaturedStores(
  stores: CommerceStore[],
): Promise<CommerceStore[]> {
  if (!stores.length) return [];

  const supabase = await createClient();
  const storeIds = stores.map((s) => s.id);

  const [followers, products, verifications, ratings] = await Promise.all([
    supabase.from("store_followers").select("store_id").in("store_id", storeIds),
    supabase
      .from("products")
      .select("store_id")
      .in("store_id", storeIds)
      .eq("is_active", true),
    supabase
      .from("store_verifications")
      .select("store_id, status")
      .in("store_id", storeIds)
      .eq("status", "verified"),
    supabase
      .from("store_reviews")
      .select("store_id, rating")
      .in("store_id", storeIds)
      .eq("status", "approved"),
  ]);

  const followerMap = new Map<string, number>();
  for (const row of followers.data ?? []) {
    const id = row.store_id as string;
    followerMap.set(id, (followerMap.get(id) ?? 0) + 1);
  }

  const productMap = new Map<string, number>();
  for (const row of products.data ?? []) {
    const id = row.store_id as string;
    productMap.set(id, (productMap.get(id) ?? 0) + 1);
  }

  const verifiedSet = new Set(
    (verifications.data ?? []).map((v) => v.store_id as string),
  );

  const ratingSum = new Map<string, { total: number; count: number }>();
  for (const row of ratings.data ?? []) {
    const id = row.store_id as string;
    const current = ratingSum.get(id) ?? { total: 0, count: 0 };
    current.total += Number(row.rating);
    current.count += 1;
    ratingSum.set(id, current);
  }

  return stores.map((store) => {
    const ratingData = ratingSum.get(store.id);
    return {
      ...store,
      follower_count: followerMap.get(store.id) ?? 0,
      product_count: productMap.get(store.id) ?? 0,
      rating: ratingData
        ? Math.round((ratingData.total / ratingData.count) * 10) / 10
        : 0,
      is_verified: verifiedSet.has(store.id),
    };
  });
}

async function loadTopRatedProducts(limit = 12): Promise<CommerceProduct[]> {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("product_reviews")
    .select("product_id, rating")
    .eq("status", "approved");

  const agg = new Map<string, { total: number; count: number }>();
  for (const row of reviews ?? []) {
    const id = row.product_id as string;
    const current = agg.get(id) ?? { total: 0, count: 0 };
    current.total += Number(row.rating);
    current.count += 1;
    agg.set(id, current);
  }

  const topIds = [...agg.entries()]
    .map(([id, { total, count }]) => ({ id, avg: total / count, count }))
    .filter((x) => x.count >= 1)
    .sort((a, b) => b.avg - a.avg || b.count - a.count)
    .slice(0, limit);

  if (!topIds.length) return [];

  const { data: products } = await supabase
    .from("products")
    .select(
      "id, name, slug, price, currency, image_url, store:stores!inner(id, name, slug, status, mode)",
    )
    .in(
      "id",
      topIds.map((t) => t.id),
    )
    .eq("is_active", true)
    .eq("store.status", "active")
    .eq("store.mode", "marketplace");

  const avgMap = new Map(topIds.map((t) => [t.id, t]));

  const results: CommerceProduct[] = [];
  for (const p of products ?? []) {
    const store = parseStoreRelation(p.store);
    if (!store?.id) continue;
    const stats = avgMap.get(p.id as string);
    results.push({
      id: p.id as string,
      name: p.name as string,
      slug: p.slug as string,
      price: Number(p.price),
      currency: p.currency as string,
      image_url: (p.image_url as string | null) ?? null,
      store_id: store.id,
      store_name: store.name,
      store_slug: store.slug,
      avg_rating: stats ? Math.round(stats.avg * 10) / 10 : 0,
      review_count: stats?.count ?? 0,
    });
  }
  return results;
}

async function loadFlashDealProducts(limit = 12): Promise<CommerceProduct[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: promos } = await supabase
    .from("merchant_promotions")
    .select("store_id, discount_percent")
    .eq("is_active", true)
    .lte("starts_at", now)
    .gte("expires_at", now)
    .order("discount_percent", { ascending: false })
    .limit(limit);

  if (!promos?.length) return [];

  const storeDiscount = new Map<string, number>();
  for (const p of promos) {
    storeDiscount.set(p.store_id as string, Number(p.discount_percent));
  }

  const { data: products } = await supabase
    .from("products")
    .select(
      "id, name, slug, price, currency, image_url, store_id, store:stores!inner(id, name, slug, status, mode)",
    )
    .in("store_id", [...storeDiscount.keys()])
    .eq("is_active", true)
    .eq("store.status", "active")
    .eq("store.mode", "marketplace")
    .order("created_at", { ascending: false })
    .limit(limit);

  const results: CommerceProduct[] = [];
  for (const p of products ?? []) {
    const store = parseStoreRelation(p.store);
    if (!store?.id) continue;
    results.push({
      id: p.id as string,
      name: p.name as string,
      slug: p.slug as string,
      price: Number(p.price),
      currency: p.currency as string,
      image_url: (p.image_url as string | null) ?? null,
      store_id: store.id,
      store_name: store.name,
      store_slug: store.slug,
      discount_percent: storeDiscount.get(p.store_id as string) ?? 0,
    });
  }
  return results;
}

async function loadMerchantNetwork(): Promise<CommerceMerchantNetworkItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("brands")
    .select(
      "id, name, slug, logo_url, approved_at, store_id, store:stores(id, business_type, logo_url, status)",
    )
    .eq("status", "approved")
    .order("approved_at", { ascending: false })
    .limit(50);

  if (!data?.length) return [];

  const storeIds = data
    .map((row) => {
      const store = parseStoreRelation(row.store);
      return store?.id ?? (row.store_id as string | undefined);
    })
    .filter(Boolean) as string[];

  const countryByStore = new Map<string, string>();
  if (storeIds.length) {
    const { data: events } = await supabase
      .from("commerce_analytics_events")
      .select("store_id, country_code")
      .in("store_id", storeIds)
      .not("country_code", "is", null)
      .order("created_at", { ascending: false })
      .limit(200);

    for (const row of events ?? []) {
      const sid = row.store_id as string;
      if (!countryByStore.has(sid) && row.country_code) {
        countryByStore.set(sid, row.country_code as string);
      }
    }
  }

  const verifiedStoreIds = new Set<string>();
  if (storeIds.length) {
    const { data: verifications } = await supabase
      .from("store_verifications")
      .select("store_id")
      .in("store_id", storeIds)
      .eq("status", "verified");
    for (const row of verifications ?? []) {
      verifiedStoreIds.add(row.store_id as string);
    }
  }

  return data
    .map((row) => {
      const store = parseStoreRelation(row.store);
      const storeMeta =
        row.store && typeof row.store === "object" && !Array.isArray(row.store)
          ? (row.store as { business_type?: string | null; logo_url?: string | null })
          : null;
      const storeId = store?.id ?? (row.store_id as string);
      return {
        id: row.id as string,
        name: row.name as string,
        slug: row.slug as string,
        logo_url: (row.logo_url as string | null) ?? storeMeta?.logo_url ?? null,
        store_id: storeId,
        category: storeMeta?.business_type ?? null,
        country_code: countryByStore.get(storeId) ?? null,
        is_verified: verifiedStoreIds.has(storeId),
        approved_at: row.approved_at as string | null,
      };
    })
    .filter((item) => Boolean(item.name));
}

async function loadFaqItems(): Promise<CommerceFaqItem[]> {
  const announcements = await getActiveTickerAnnouncements();
  if (announcements.length) {
    return announcements.map((a) => ({
      id: a.id,
      question: a.message.slice(0, 80) + (a.message.length > 80 ? "…" : ""),
      answer: a.message,
    }));
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("commerce_activity_events")
    .select("id, activity_type, payload, created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(8);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    question: `What is ${(row.activity_type as string).replace(/_/g, " ")}?`,
    answer:
      typeof row.payload === "object" && row.payload !== null
        ? JSON.stringify(row.payload)
        : "Live marketplace activity from the Nexar Commerce network.",
  }));
}

function emptyMarketplaceStats(): MarketplaceStatisticsPayload {
  return {
    latest_products: [],
    trending_products: [],
    featured_stores: [],
    approved_brands: [],
    computed_at: new Date().toISOString(),
  };
}

async function safe<T>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[commerce] ${label} unavailable:`, error);
    }
    return fallback;
  }
}

export async function loadCommerceHomeData(): Promise<CommerceHomeData> {
  const liveRow = await safe(
    "live metrics",
    () => getLiveCommerceMetrics(),
    { payload: {}, updated_at: new Date().toISOString() },
  );

  const [
    marketplaceRaw,
    brands,
    merchantNetwork,
    countries,
    activity,
    categories,
    subscriptionPlans,
    topRatedProducts,
    flashDealProducts,
    activeCountryCodes,
  ] = await Promise.all([
    safe("marketplace statistics", () => getMarketplaceStatistics(24), emptyMarketplaceStats()),
    safe("brands", () => listApprovedBrands(50), [] as CommerceBrand[]),
    safe("merchant network", loadMerchantNetwork, [] as CommerceMerchantNetworkItem[]),
    safe("countries", loadCountries, [] as CommerceCountry[]),
    safe("activity", () => loadActivity(40), [] as CommerceActivityEvent[]),
    safe("categories", loadCategories, [] as CommerceCategory[]),
    safe("subscription plans", loadSubscriptionPlans, [] as CommerceSubscriptionPlan[]),
    safe("top rated products", () => loadTopRatedProducts(12), [] as CommerceProduct[]),
    safe("flash deals", () => loadFlashDealProducts(12), [] as CommerceProduct[]),
    safe("active country codes", loadActiveCountryCodes, [] as string[]),
  ]);

  const livePayload = (liveRow?.payload ?? {}) as LiveMetricsPayload;
  const marketplace: MarketplaceStatisticsPayload = {
    latest_products: normalizeRpcProducts(marketplaceRaw.latest_products),
    trending_products: normalizeRpcProducts(marketplaceRaw.trending_products),
    approved_brands: marketplaceRaw.approved_brands
      .filter((row): row is Record<string, unknown> => !!row && typeof row === "object")
      .map(normalizeRpcBrand)
      .filter((row): row is CommerceBrand => row !== null),
    featured_stores: await safe(
      "featured store enrichment",
      () => enrichFeaturedStores(normalizeRpcStores(marketplaceRaw.featured_stores)),
      [],
    ),
    computed_at: marketplaceRaw.computed_at,
  };

  const faqItems = await safe("faq", loadFaqItems, [] as CommerceFaqItem[]);

  return {
    liveMetrics: livePayload,
    marketplace,
    brands: brands.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logo_url: b.logo_url,
      store_id: b.store_id,
      approved_at: b.approved_at,
    })),
    merchantNetwork,
    countries,
    activity,
    categories,
    subscriptionPlans,
    faqItems,
    topRatedProducts,
    flashDealProducts,
    activeCountryCodes,
  };
}
