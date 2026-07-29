import { createClient } from "@/lib/supabase/server";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import type { StoreDirectoryEntry, StoreMarketplaceProfile, StoreSettings } from "@/types";

export type StoreSearchInput = {
  q?: string;
  categorySlug?: string;
  sort?: "featured" | "top_rated" | "best_selling" | "newest" | "name";
  page?: number;
  limit?: number;
};

function parseProfile(raw: unknown): StoreMarketplaceProfile {
  if (!raw || typeof raw !== "object") return {};
  return raw as StoreMarketplaceProfile;
}

function deriveRating(salesCount: number): number {
  if (salesCount >= 100) return 4.9;
  if (salesCount >= 50) return 4.7;
  if (salesCount >= 20) return 4.5;
  if (salesCount >= 5) return 4.2;
  if (salesCount >= 1) return 4.0;
  return 0;
}

async function loadStoreDirectoryMetrics(
  storeIds: string[],
  ownerIds: string[],
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{
  productCounts: Map<string, number>;
  salesCounts: Map<string, number>;
  verificationByOwner: Map<string, string>;
}> {
  const admin = tryCreateAdminClient();

  if (admin) {
    const [{ data: products }, { data: orders }, { data: merchants }] = await Promise.all([
      admin.from("products").select("store_id").eq("is_active", true).in("store_id", storeIds),
      admin.from("orders").select("store_id").eq("status", "paid").in("store_id", storeIds),
      admin
        .from("merchant_profiles")
        .select("profile_id, verification_status")
        .in("profile_id", ownerIds),
    ]);

    const productCounts = new Map<string, number>();
    for (const product of products ?? []) {
      productCounts.set(product.store_id, (productCounts.get(product.store_id) ?? 0) + 1);
    }

    const salesCounts = new Map<string, number>();
    for (const order of orders ?? []) {
      salesCounts.set(order.store_id, (salesCounts.get(order.store_id) ?? 0) + 1);
    }

    const verificationByOwner = new Map(
      (merchants ?? []).map((merchant) => [merchant.profile_id, merchant.verification_status as string])
    );

    return { productCounts, salesCounts, verificationByOwner };
  }

  const [{ data: products }, { data: trustRows }] = await Promise.all([
    supabase.from("products").select("store_id").eq("is_active", true).in("store_id", storeIds),
    supabase.from("store_trust_metrics").select("store_id, total_orders").in("store_id", storeIds),
  ]);

  const productCounts = new Map<string, number>();
  for (const product of products ?? []) {
    productCounts.set(product.store_id, (productCounts.get(product.store_id) ?? 0) + 1);
  }

  const salesCounts = new Map<string, number>();
  for (const row of trustRows ?? []) {
    salesCounts.set(row.store_id, Number(row.total_orders ?? 0));
  }

  return { productCounts, salesCounts, verificationByOwner: new Map() };
}

export async function searchMarketplaceStores(
  input: StoreSearchInput = {}
): Promise<{ stores: StoreDirectoryEntry[]; total: number }> {
  const page = input.page ?? 1;
  const limit = input.limit ?? 12;
  const offset = (page - 1) * limit;

  const supabase = await createClient();
  let query = supabase
    .from("stores")
    .select(
      "*, settings:store_settings(accepts_crypto, accepts_card, default_currency, marketplace_profile)",
      { count: "exact" }
    )
    .eq("status", "active")
    .eq("mode", "marketplace");

  if (input.q?.trim()) {
    query = query.ilike("name", `%${input.q.trim()}%`);
  }

  const { data: stores, error, count } = await query.range(offset, offset + limit - 1);
  if (error || !stores?.length) return { stores: [], total: count ?? 0 };

  const storeIds = stores.map((s) => s.id);
  const ownerIds = stores.map((s) => s.owner_id);

  const { productCounts, salesCounts, verificationByOwner } = await loadStoreDirectoryMetrics(
    storeIds,
    ownerIds,
    supabase
  );

  const maxSales = Math.max(...Array.from(salesCounts.values()), 0);

  let entries: StoreDirectoryEntry[] = stores.map((store) => {
    const sales = salesCounts.get(store.id) ?? 0;
    const settingsRow = store.settings as StoreSettings | StoreSettings[] | null;
    const settings = Array.isArray(settingsRow) ? settingsRow[0] : settingsRow;

    return {
      ...(store as StoreDirectoryEntry),
      settings: settings
        ? {
            accepts_crypto: settings.accepts_crypto,
            accepts_card: settings.accepts_card,
            default_currency: settings.default_currency,
            marketplace_profile: parseProfile(settings.marketplace_profile),
          }
        : null,
      product_count: productCounts.get(store.id) ?? 0,
      sales_count: sales,
      rating: deriveRating(sales),
      verification_status: verificationByOwner.get(store.owner_id) ?? null,
      is_top_seller: sales > 0 && sales >= maxSales * 0.8,
    };
  });

  if (input.categorySlug) {
    const supabase = await createClient();
    const { data: categoryProducts } = await supabase
      .from("products")
      .select("store_id, category:product_categories!inner(slug)")
      .eq("is_active", true)
      .eq("product_categories.slug", input.categorySlug);

    const allowed = new Set((categoryProducts ?? []).map((p) => p.store_id as string));
    entries = entries.filter((e) => allowed.has(e.id));
  }

  switch (input.sort) {
    case "name":
      entries.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "best_selling":
      entries.sort((a, b) => b.sales_count - a.sales_count);
      break;
    case "top_rated":
      entries.sort((a, b) => b.rating - a.rating);
      break;
    case "featured":
      entries.sort((a, b) => {
        const af = a.settings?.marketplace_profile?.featured ? 1 : 0;
        const bf = b.settings?.marketplace_profile?.featured ? 1 : 0;
        return bf - af || b.sales_count - a.sales_count;
      });
      break;
    default:
      entries.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }

  return { stores: entries, total: count ?? entries.length };
}

export async function getFeaturedStores(limit = 6): Promise<StoreDirectoryEntry[]> {
  const { stores } = await searchMarketplaceStores({ sort: "featured", limit: 50 });
  const featured = stores.filter((s) => s.settings?.marketplace_profile?.featured);
  return (featured.length ? featured : stores).slice(0, limit);
}

export async function getStorePublicProfile(slug: string) {
  const supabase = await createClient();
  const { data: store } = await supabase
    .from("stores")
    .select(
      "*, settings:store_settings(*), owner:profiles!stores_owner_id_fkey(id, full_name, email)"
    )
    .eq("slug", slug)
    .eq("status", "active")
    .eq("mode", "marketplace")
    .maybeSingle();

  if (!store) return null;

  const admin = tryCreateAdminClient();
  let productCount = 0;
  let salesCount = 0;
  let verificationStatus: string | null = null;
  let verificationLevel: string | null = null;

  if (admin) {
    const [{ count: activeProducts }, { count: paidOrders }, { data: merchant }] =
      await Promise.all([
        admin
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("store_id", store.id)
          .eq("is_active", true),
        admin
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("store_id", store.id)
          .eq("status", "paid"),
        admin
          .from("merchant_profiles")
          .select("verification_status, verification_level")
          .eq("profile_id", store.owner_id)
          .maybeSingle(),
      ]);

    productCount = activeProducts ?? 0;
    salesCount = paidOrders ?? 0;
    verificationStatus = merchant?.verification_status ?? null;
    verificationLevel = merchant?.verification_level ?? null;
  } else {
    const [{ count: activeProducts }, { data: trust }] = await Promise.all([
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("store_id", store.id)
        .eq("is_active", true),
      supabase
        .from("store_trust_metrics")
        .select("total_orders")
        .eq("store_id", store.id)
        .maybeSingle(),
    ]);

    productCount = activeProducts ?? 0;
    salesCount = Number(trust?.total_orders ?? 0);
  }

  const settings = Array.isArray(store.settings) ? store.settings[0] : store.settings;
  const profile = parseProfile(settings?.marketplace_profile);

  return {
    store,
    settings: settings as StoreSettings | null,
    profile,
    productCount,
    salesCount,
    rating: deriveRating(salesCount),
    verificationStatus,
    verificationLevel,
  };
}

export async function getRelatedProducts(
  productId: string,
  storeId: string,
  categoryId: string | null,
  limit = 4
) {
  const { searchMarketplaceProducts } = await import("@/modules/catalog/repository");
  const { products } = await searchMarketplaceProducts({
    page: 1,
    limit: limit + 1,
    sort: "newest",
    onSale: false,
    inStock: false,
  });

  return products
    .filter((p) => p.id !== productId)
    .filter((p) => (categoryId ? p.category_id === categoryId : p.store_id === storeId))
    .slice(0, limit);
}
