import { createClient } from "@/lib/supabase/server";
import { searchMarketplaceProducts } from "@/modules/catalog/repository";
import { searchMarketplaceStores } from "./repository";

export type MarketplaceSearchSuggestion = {
  type: "product" | "category" | "store";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  imageUrl?: string | null;
};

export type MarketplaceSearchSuggestions = {
  query: string;
  suggestions: MarketplaceSearchSuggestion[];
};

export async function suggestMarketplaceSearch(
  query: string,
  limit = 8
): Promise<MarketplaceSearchSuggestions> {
  const q = query.trim();
  if (q.length < 2) {
    return { query: q, suggestions: [] };
  }

  const productLimit = Math.max(3, Math.ceil(limit * 0.6));
  const storeLimit = Math.max(2, Math.ceil(limit * 0.25));
  const categoryLimit = Math.max(2, limit - productLimit - storeLimit);

  const supabase = await createClient();

  const [{ products }, { stores }, categoriesResult] = await Promise.all([
    searchMarketplaceProducts({
      q,
      page: 1,
      limit: productLimit,
      sort: "best_selling",
      onSale: false,
      inStock: false,
    }),
    searchMarketplaceStores({ q, page: 1, limit: storeLimit }),
    supabase
      .from("marketplace_categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .ilike("name", `%${q}%`)
      .order("sort_order")
      .limit(categoryLimit),
  ]);

  const suggestions: MarketplaceSearchSuggestion[] = [];

  for (const category of categoriesResult.data ?? []) {
    suggestions.push({
      type: "category",
      id: category.id,
      title: category.name,
      subtitle: "Category",
      href: `/marketplace/browse?category=${category.slug}`,
    });
  }

  for (const store of stores) {
    suggestions.push({
      type: "store",
      id: store.id,
      title: store.name,
      subtitle: store.product_count
        ? `${store.product_count} products`
        : "Store",
      href: `/store/${store.slug}`,
      imageUrl: store.logo_url,
    });
  }

  for (const product of products) {
    suggestions.push({
      type: "product",
      id: product.id,
      title: product.name,
      subtitle: product.store.name,
      href: `/marketplace/products/${product.id}`,
      imageUrl: product.image_url,
    });
  }

  return {
    query: q,
    suggestions: suggestions.slice(0, limit),
  };
}
