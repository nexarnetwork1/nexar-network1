import type { CatalogListParams, CatalogListResult } from "../../shared/types";

export interface SearchRepository {
  searchProducts(params: CatalogListParams): Promise<CatalogListResult>;
  suggest(query: string, limit?: number): Promise<{ id: string; title: string }[]>;
}
