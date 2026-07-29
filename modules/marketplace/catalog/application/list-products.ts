import type { CatalogListParams, CatalogListResult } from "../../shared/types";
import { catalogRepository } from "../infrastructure/supabase-catalog-repository";

export async function listCatalogProducts(
  params: CatalogListParams = {}
): Promise<CatalogListResult> {
  return catalogRepository.listProducts(params);
}
