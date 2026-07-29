import type { CatalogProductDetail } from "../../shared/types";
import { catalogRepository } from "../infrastructure/supabase-catalog-repository";

export async function getCatalogProductByHandle(
  handle: string
): Promise<CatalogProductDetail | null> {
  return catalogRepository.getProductByHandle(handle);
}

export async function getCatalogProductById(
  id: string
): Promise<CatalogProductDetail | null> {
  return catalogRepository.getProductById(id);
}
