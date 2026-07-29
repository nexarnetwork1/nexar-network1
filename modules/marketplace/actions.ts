"use server";

import { getMarketplaceProductsByIds } from "@/modules/marketplace/home";
import type { ProductWithStore } from "@/types";

const MAX_IDS = 12;

export async function resolveMarketplaceProductsByIdsAction(
  productIds: string[]
): Promise<ProductWithStore[]> {
  const uniqueIds = [...new Set(productIds.filter(Boolean))].slice(0, MAX_IDS);
  if (uniqueIds.length === 0) return [];

  return getMarketplaceProductsByIds(uniqueIds);
}
