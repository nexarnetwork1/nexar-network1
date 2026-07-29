import { createClient } from "@/lib/supabase/server";
import type {
  Product,
  ProductWithDetails,
  ProductCategory,
  ProductImage,
  Inventory,
} from "@/types";

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

export async function getMerchantProductsWithInventory(
  storeId: string
): Promise<Array<Product & { inventory: Inventory | null }>> {
  const products = await getMerchantProducts(storeId);
  if (products.length === 0) return [];

  const supabase = await createClient();
  const { data: inventoryRows } = await supabase
    .from("inventory")
    .select("*")
    .in(
      "product_id",
      products.map((p) => p.id)
    );

  const byProduct = new Map(
    (inventoryRows ?? []).map((row) => [row.product_id as string, row as Inventory])
  );

  return products.map((product) => ({
    ...product,
    inventory: byProduct.get(product.id) ?? null,
  }));
}

export async function getStoreCategories(storeId: string): Promise<ProductCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_categories")
    .select("*")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .order("sort_order");

  if (error) return [];
  return (data ?? []) as ProductCategory[];
}

export async function getProductImages(productId: string): Promise<ProductImage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order");

  if (error) return [];
  return (data ?? []) as ProductImage[];
}

export async function getProductInventory(productId: string): Promise<Inventory | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .eq("product_id", productId)
    .maybeSingle();

  if (error) return null;
  return data as Inventory | null;
}

export async function getProductWithDetails(
  productId: string
): Promise<ProductWithDetails | null> {
  const product = await getProductById(productId);
  if (!product) return null;

  const images = await getProductImages(productId);
  return { ...product, images };
}
