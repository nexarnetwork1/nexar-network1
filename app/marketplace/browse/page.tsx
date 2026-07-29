import Link from "next/link";
import {
  searchMarketplaceProducts,
} from "@/modules/catalog/repository";
import { getPlatformMarketplaceCategories } from "@/modules/marketplace/home";
import { getProductRatingSummaries } from "@/modules/reviews/repository";
import { productSearchSchema } from "@/modules/catalog/validators";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { Container } from "@/components/ui/Container";
import { Footer } from "@/components/layout/Footer";
import { MarketplaceArtwork } from "@/components/marketplace/MarketplaceArtwork";
import { MarketplaceBrowseActiveFilters } from "@/components/marketplace/MarketplaceBrowseActiveFilters";
import { MarketplaceSearch } from "@/components/marketplace/MarketplaceSearch";
import { CurrencySelectField } from "@/components/payments/CurrencySelectField";
import { buildMarketplaceBrowseHref } from "@/modules/marketplace/browse-url";
import { DROPDOWN_CLASS } from "@/lib/constants/navigation";
import { buildMarketplaceMetadata } from "@/lib/seo/marketplace";

export const metadata = buildMarketplaceMetadata({
  title: "Browse Products",
  description: "Search and filter products from verified Nexar marketplace merchants.",
  path: "/marketplace/browse",
});

type Props = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    category?: string;
    sort?: string;
    sale?: string;
    currency?: string;
    minPrice?: string;
    maxPrice?: string;
    stock?: string;
    rating?: string;
  }>;
};

export default async function MarketplaceBrowsePage({ searchParams }: Props) {
  const rawParams = await searchParams;
  const parsed = productSearchSchema.safeParse({
    q: rawParams.q,
    page: rawParams.page,
    categorySlug: rawParams.category,
    sort: rawParams.sort,
    onSale: rawParams.sale,
    currency: rawParams.currency,
    minPrice: rawParams.minPrice,
    maxPrice: rawParams.maxPrice,
    inStock: rawParams.stock,
    minRating: rawParams.rating,
    limit: 20,
  });

  const filters = parsed.success
    ? parsed.data
    : {
        q: undefined,
        page: 1,
        limit: 20,
        categorySlug: undefined,
        sort: "newest" as const,
        onSale: false,
        currency: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        inStock: false,
        merchantSlug: undefined,
        minRating: undefined,
      };

  const [{ products, total }, categories] = await Promise.all([
    searchMarketplaceProducts(filters),
    getPlatformMarketplaceCategories(),
  ]);
  const ratingSummaries = await getProductRatingSummaries(
    products.map((product) => product.id)
  );

  const totalPages = Math.ceil(total / filters.limit);

  const browseHref = (overrides?: Partial<typeof filters>) =>
    buildMarketplaceBrowseHref("/marketplace/browse", filters, overrides);

  return (
    <>
      <div className="relative min-h-[calc(100vh-var(--nxr-header-offset))]">
        <MarketplaceArtwork />
        <Container as="div" className="relative py-10 sm:py-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Link href="/marketplace" className="text-sm text-muted hover:text-gold">
                ← Marketplace home
              </Link>
              <h1 className="mt-2 font-heading text-3xl font-semibold md:text-4xl">Browse Products</h1>
              <p className="mt-2 text-muted">Search, filter, and shop from verified merchants.</p>
            </div>
            <Link href="/marketplace/stores" className="text-sm text-gold hover:underline">
              Browse stores →
            </Link>
          </div>

          <form className="mt-8 grid gap-3 rounded-2xl border border-border bg-card/20 p-4 md:grid-cols-2 lg:grid-cols-4">
            <MarketplaceSearch
              asField
              defaultValue={filters.q ?? ""}
              placeholder="Search products…"
              variant="compact"
              className="lg:col-span-2"
            />
            <select name="sort" defaultValue={filters.sort} className={DROPDOWN_CLASS}>
              <option value="newest">Newest</option>
              <option value="featured">Featured</option>
              <option value="best_selling">Popularity</option>
              <option value="highest_rated">Highest rated</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="name">Name</option>
            </select>
            <select name="category" defaultValue={filters.categorySlug ?? ""} className={DROPDOWN_CLASS}>
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
            <CurrencySelectField
              name="currency"
              defaultValue={filters.currency ?? ""}
              includeEmpty
              showLogo={Boolean(filters.currency)}
              className="rounded-xl border-border bg-surface/80 px-3 py-3 text-sm"
            />
            <input
              name="minPrice"
              type="number"
              step="0.01"
              placeholder="Min price"
              defaultValue={filters.minPrice ?? ""}
              className="rounded-xl border border-border bg-surface/80 px-3 py-3 text-sm"
            />
            <input
              name="maxPrice"
              type="number"
              step="0.01"
              placeholder="Max price"
              defaultValue={filters.maxPrice ?? ""}
              className="rounded-xl border border-border bg-surface/80 px-3 py-3 text-sm"
            />
            <select
              name="rating"
              defaultValue={filters.minRating ? String(filters.minRating) : ""}
              className={DROPDOWN_CLASS}
            >
              <option value="">Any rating</option>
              <option value="4">4+ stars</option>
              <option value="3">3+ stars</option>
              <option value="2">2+ stars</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="stock" defaultChecked={filters.inStock} /> In stock only
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="sale" defaultChecked={filters.onSale} /> On sale
            </label>
            <button
              type="submit"
              className="rounded-xl border border-gold/30 bg-gold/10 px-6 py-3 text-sm font-medium text-gold lg:col-span-2"
            >
              Apply filters
            </button>
          </form>

          <MarketplaceBrowseActiveFilters filters={filters} categories={categories} />

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href={browseHref({ categorySlug: undefined, onSale: false, page: 1 })}
              className={`rounded-full px-3 py-1 text-xs ${
                !filters.categorySlug && !filters.onSale
                  ? "bg-gold text-background"
                  : "border border-border text-muted"
              }`}
            >
              All
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={browseHref({ categorySlug: category.slug, page: 1 })}
                className={`rounded-full px-3 py-1 text-xs ${
                  filters.categorySlug === category.slug
                    ? "bg-gold text-background"
                    : "border border-border text-muted"
                }`}
              >
                {category.name}
              </Link>
            ))}
          </div>

          {products.length === 0 ? (
            <div className="mt-12 rounded-2xl border border-border bg-card/40 p-12 text-center text-muted">
              No products found.
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  productBasePath="/marketplace/products"
                  ratingSummary={ratingSummaries.get(product.id)}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={browseHref({ page: p })}
                  className={`rounded-lg px-3 py-1 text-sm ${
                    p === filters.page ? "bg-gold text-background" : "border border-border text-muted"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </Container>
      </div>
      <Footer />
    </>
  );
}
