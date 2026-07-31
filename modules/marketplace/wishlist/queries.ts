"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/modules/users/repository";
import { wishlistRepository } from "@/modules/marketplace/wishlist";
import type { StorefrontProduct } from "@/modules/marketplace/storefront/types";

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

export async function getWishlistProducts(): Promise<StorefrontProduct[]> {
  const profile = await getCurrentProfile();
  if (!profile) return [];

  const productIds = await wishlistRepository.listProductIds(profile.id);
  if (!productIds.length) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .in("id", productIds)
    .eq("is_active", true)
    .eq("store.status", "active")
    .eq("store.mode", "marketplace");

  const products = (data ?? []).map((row) => mapProduct(row as Record<string, unknown>));
  const order = new Map(productIds.map((id, i) => [id, i]));
  products.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return products;
}
