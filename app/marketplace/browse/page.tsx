import Link from "next/link";
import {
  searchMarketplaceProducts,
} from "@/modules/catalog/repository";
import { getPlatformMarketplaceCategories } from "@/modules/marketplace/home";
import { productSearchSchema } from "@/modules/catalog/validators";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { Container } from "@/components/ui/Container";
import { Footer } from "@/components/layout/Footer";
import { MarketplaceArtwork } from "@/components/marketplace/MarketplaceArtwork";
import { MarketplaceSearch } from "@/components/marketplace/MarketplaceSearch";
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
      };

  const [{ products, total }, categories] = await Promise.all([
    searchMarketplaceProducts(filters),
    getPlatformMarketplaceCategories(),
  ]);

  const totalPages = Math.ceil(total / filters.limit);

  function browseHref(options?: Record<string, string | number | boolean | undefined>) {
    const params = new URLSearchParams();
    const merged = { ...filters, ...options };
    if (merged.q) params.set("q", String(merged.q));
    if (merged.page && merged.page > 1) params.set("page", String(merged.page));
    if (merged.categorySlug) params.set("category", String(merged.categorySlug));
    if (merged.sort && merged.sort !== "newest") params.set("sort", String(merged.sort));
    if (merged.onSale) params.set("sale", "true");
    if (merged.currency) params.set("currency", String(merged.currency));
    if (merged.minPrice) params.set("minPrice", String(merged.minPrice));
    if (merged.maxPrice) params.set("maxPrice", String(merged.maxPrice));
    if (merged.inStock) params.set("stock", "true");
    const query = params.toString();
    return query ? `/marketplace/browse?${query}` : "/marketplace/browse";
  }

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
