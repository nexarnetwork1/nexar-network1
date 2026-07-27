import { createClient } from "@/lib/supabase/server";
import type { Product, ProductWithStore } from "@/types";
import type { ProductSearchInput } from "./validators";

export async function getMerchantProducts(storeId: string): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data as Product[];
}

export async function getProductById(productId: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (error) return null;
  return data as Product;
}

export async function searchMarketplaceProducts(
  input: ProductSearchInput
): Promise<{ products: ProductWithStore[]; total: number }> {
  const supabase = await createClient();
  const offset = (input.page - 1) * input.limit;

  let query = supabase
    .from("products")
    .select(
      "*, store:stores!inner(id, name, slug, logo_url, status, mode)",
      { count: "exact" }
    )
    .eq("is_active", true)
    .eq("store.status", "active")
    .eq("store.mode", "marketplace");

  if (input.storeSlug) {
    query = query.eq("store.slug", input.storeSlug);
  }

  if (input.q?.trim()) {
    query = query.textSearch("search_vector", input.q.trim(), {
      type: "websearch",
      config: "english",
    });
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + input.limit - 1);

  if (error) return { products: [], total: 0 };

  return {
    products: (data ?? []) as ProductWithStore[],
    total: count ?? 0,
  };
}

export async function getMarketplaceProduct(
  productId: string
): Promise<ProductWithStore | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, store:stores!inner(id, name, slug, logo_url, status, mode)")
    .eq("id", productId)
    .eq("is_active", true)
    .eq("store.status", "active")
    .eq("store.mode", "marketplace")
    .single();

  if (error) return null;
  return data as ProductWithStore;
}
