import Link from "next/link";
import type { ProductSearchInput } from "@/modules/catalog/validators";
import { buildMarketplaceBrowseHref } from "@/modules/marketplace/browse-url";

const SORT_LABELS: Record<ProductSearchInput["sort"], string> = {
  newest: "Newest",
  featured: "Featured",
  best_selling: "Popularity",
  highest_rated: "Highest rated",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  name: "Name",
};

type BrowseCategory = {
  slug: string;
  name: string;
};

type ActiveFilter = {
  id: string;
  label: string;
  clear: Partial<ProductSearchInput>;
};

type MarketplaceBrowseActiveFiltersProps = {
  filters: ProductSearchInput;
  categories: BrowseCategory[];
  basePath?: string;
};

function getActiveFilters(
  filters: ProductSearchInput,
  categories: BrowseCategory[]
): ActiveFilter[] {
  const chips: ActiveFilter[] = [];

  if (filters.q?.trim()) {
    chips.push({
      id: "q",
      label: `Search: "${filters.q.trim()}"`,
      clear: { q: undefined },
    });
  }

  if (filters.categorySlug) {
    const categoryName =
      categories.find((category) => category.slug === filters.categorySlug)?.name ??
      filters.categorySlug;
    chips.push({
      id: "category",
      label: categoryName,
      clear: { categorySlug: undefined },
    });
  }

  if (filters.sort !== "newest") {
    chips.push({
      id: "sort",
      label: SORT_LABELS[filters.sort],
      clear: { sort: "newest" },
    });
  }

  if (filters.currency) {
    chips.push({
      id: "currency",
      label: filters.currency,
      clear: { currency: undefined },
    });
  }

  if (filters.minPrice != null && filters.maxPrice != null) {
    chips.push({
      id: "price-range",
      label: `$${filters.minPrice}–$${filters.maxPrice}`,
      clear: { minPrice: undefined, maxPrice: undefined },
    });
  } else if (filters.minPrice != null) {
    chips.push({
      id: "min-price",
      label: `Min $${filters.minPrice}`,
      clear: { minPrice: undefined },
    });
  } else if (filters.maxPrice != null) {
    chips.push({
      id: "max-price",
      label: `Max $${filters.maxPrice}`,
      clear: { maxPrice: undefined },
    });
  }

  if (filters.minRating != null) {
    chips.push({
      id: "rating",
      label: `${filters.minRating}+ stars`,
      clear: { minRating: undefined },
    });
  }

  if (filters.inStock) {
    chips.push({
      id: "stock",
      label: "In stock",
      clear: { inStock: false },
    });
  }

  if (filters.onSale) {
    chips.push({
      id: "sale",
      label: "On sale",
      clear: { onSale: false },
    });
  }

  return chips;
}

export function MarketplaceBrowseActiveFilters({
  filters,
  categories,
  basePath = "/marketplace/browse",
}: MarketplaceBrowseActiveFiltersProps) {
  const activeFilters = getActiveFilters(filters, categories);

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">Active filters</span>
      {activeFilters.map((filter) => (
        <Link
          key={filter.id}
          href={buildMarketplaceBrowseHref(basePath, filters, {
            ...filter.clear,
            page: 1,
          })}
          className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs text-gold transition hover:bg-gold/20"
          aria-label={`Remove ${filter.label} filter`}
        >
          <span>{filter.label}</span>
          <span aria-hidden="true">×</span>
        </Link>
      ))}
      <Link
        href={basePath}
        className="text-xs text-muted underline-offset-2 hover:text-gold hover:underline"
      >
        Clear all
      </Link>
    </div>
  );
}
