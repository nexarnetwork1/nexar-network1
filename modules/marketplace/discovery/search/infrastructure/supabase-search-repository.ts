import { catalogRepository } from "../../../catalog/infrastructure/supabase-catalog-repository";
import { marketplaceConfig } from "../../../shared/config";
import type { SearchRepository } from "../application/ports";
import type { CatalogListParams, CatalogListResult } from "../../../shared/types";

export class SupabaseSearchRepository implements SearchRepository {
  async searchProducts(params: CatalogListParams): Promise<CatalogListResult> {
    return catalogRepository.listProducts(params);
  }

  async suggest(query: string, limit = 8): Promise<{ id: string; title: string }[]> {
    if (query.trim().length < marketplaceConfig.minSearchQueryLength) {
      return [];
    }

    const result = await catalogRepository.listProducts({
      query,
      limit,
      page: 1,
    });

    return result.items.map((item) => ({ id: item.id, title: item.name }));
  }
}

export const searchRepository = new SupabaseSearchRepository();
