import { createClient } from "@/lib/supabase/server";
import type {
  Product,
  ProductWithStore,
  ProductWithDetails,
  ProductCategory,
  ProductImage,
  Inventory,
} from "@/types";
import type { ProductSearchInput } from "./validators";

type ProductRowWithImages = ProductWithStore & {
  images?: Pick<ProductImage, "url" | "is_primary" | "sort_order">[];
};

function resolveProductImageUrl(
  product: Product,
  images?: Pick<ProductImage, "url" | "is_primary" | "sort_order">[]
): string | null {
  if (!images?.length) return product.image_url;
  const primary = images.find((image) => image.is_primary);
  return primary?.url ?? images[0]?.url ?? product.image_url;
}

function mapMarketplaceProducts(rows: ProductRowWithImages[]): ProductWithStore[] {
  return rows.map(({ images, ...product }) => ({
    ...product,
    image_url: resolveProductImageUrl(product, images),
  }));
}

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
      "*, store:stores!inner(id, name, slug, logo_url, status, mode), images:product_images(url, is_primary, sort_order)",
      { count: "exact" }
    )
    .eq("is_active", true)
    .eq("store.status", "active")
    .eq("store.mode", "marketplace");

  if (input.storeSlug) {
    query = query.eq("store.slug", input.storeSlug);
  }

  if (input.categorySlug) {
    const { data: category } = await supabase
      .from("product_categories")
      .select("id")
      .eq("slug", input.categorySlug)
      .eq("is_active", true)
      .maybeSingle();

    if (!category) {
      return { products: [], total: 0 };
    }

    query = query.eq("category_id", category.id);
  }

  if (input.onSale) {
    query = query.eq("is_on_sale", true);
  }

  if (input.q?.trim()) {
    query = query.textSearch("search_vector", input.q.trim(), {
      type: "websearch",
      config: "english",
    });
  }

  switch (input.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "name":
      query = query.order("name", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query
    .range(offset, offset + input.limit - 1);

  if (error) return { products: [], total: 0 };

  return {
    products: mapMarketplaceProducts((data ?? []) as ProductRowWithImages[]),
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

export async function getMarketplaceProductWithDetails(
  productId: string
): Promise<ProductWithDetails | null> {
  const product = await getMarketplaceProduct(productId);
  if (!product) return null;

  const images = await getProductImages(productId);
  return { ...product, images };
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

export async function getMarketplaceCategories(): Promise<ProductCategory[]> {
  const supabase = await createClient();
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("category_id, store:stores!inner(status, mode)")
    .eq("is_active", true)
    .eq("store.status", "active")
    .eq("store.mode", "marketplace")
    .not("category_id", "is", null);

  if (productsError || !products?.length) return [];

  const categoryIds = [
    ...new Set(
      products
        .map((p) => p.category_id as string | null)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const { data, error } = await supabase
    .from("product_categories")
    .select("*")
    .in("id", categoryIds)
    .eq("is_active", true)
    .order("name");

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
