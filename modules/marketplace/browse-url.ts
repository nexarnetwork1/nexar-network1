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
