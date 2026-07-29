import { createClient } from "@/lib/supabase/server";

export type MarketplaceSitemapData = {
  stores: Array<{ slug: string; updated_at: string }>;
  products: Array<{ id: string; updated_at: string }>;
  categories: Array<{ slug: string }>;
};

export async function getMarketplaceSitemapData(): Promise<MarketplaceSitemapData> {
  const supabase = await createClient();

  const { data: stores, error: storesError } = await supabase
    .from("stores")
    .select("id, slug, updated_at")
    .eq("status", "active")
    .eq("mode", "marketplace");

  if (storesError || !stores?.length) {
    return { stores: [], products: [], categories: [] };
  }

  const storeIds = stores.map((store) => store.id);

  const [{ data: products, error: productsError }, { data: categories, error: categoriesError }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, updated_at")
        .eq("is_active", true)
        .in("store_id", storeIds),
      supabase.from("product_categories").select("slug").eq("is_active", true),
    ]);

  if (productsError) {
    return {
      stores: stores.map(({ slug, updated_at }) => ({ slug, updated_at })),
      products: [],
      categories: categoriesError ? [] : (categories ?? []),
    };
  }

  return {
    stores: stores.map(({ slug, updated_at }) => ({ slug, updated_at })),
    products: products ?? [],
    categories: categoriesError ? [] : (categories ?? []),
  };
}
