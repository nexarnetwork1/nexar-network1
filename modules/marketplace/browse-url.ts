import type { ProductSearchInput } from "@/modules/catalog/validators";

export function buildMarketplaceBrowseHref(
  basePath: string,
  filters: ProductSearchInput,
  overrides?: Partial<ProductSearchInput>
): string {
  const merged: ProductSearchInput = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (merged.q) params.set("q", merged.q);
  if (merged.page && merged.page > 1) params.set("page", String(merged.page));
  if (merged.categorySlug) params.set("category", merged.categorySlug);
  if (merged.sort && merged.sort !== "newest") params.set("sort", merged.sort);
  if (merged.onSale) params.set("sale", "true");
  if (merged.currency) params.set("currency", merged.currency);
  if (merged.minPrice != null) params.set("minPrice", String(merged.minPrice));
  if (merged.maxPrice != null) params.set("maxPrice", String(merged.maxPrice));
  if (merged.inStock) params.set("stock", "true");
  if (merged.minRating != null) params.set("rating", String(merged.minRating));
  if (merged.merchantSlug) params.set("merchant", merged.merchantSlug);

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function hasActiveBrowseFilters(filters: ProductSearchInput): boolean {
  return Boolean(
    filters.q?.trim() ||
      filters.categorySlug ||
      filters.sort !== "newest" ||
      filters.onSale ||
      filters.currency ||
      filters.minPrice != null ||
      filters.maxPrice != null ||
      filters.inStock ||
      filters.minRating != null ||
      filters.merchantSlug
  );
}

export function getBrowseResultsRange(
  filters: ProductSearchInput,
  total: number
): { start: number; end: number; total: number; page: number; totalPages: number } | null {
  if (total < 1) return null;

  const totalPages = Math.ceil(total / filters.limit);
  const start = (filters.page - 1) * filters.limit + 1;
  const end = Math.min(filters.page * filters.limit, total);

  return {
    start,
    end,
    total,
    page: filters.page,
    totalPages,
  };
}
