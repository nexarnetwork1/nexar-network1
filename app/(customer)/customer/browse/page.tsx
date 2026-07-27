import Link from "next/link";
import {
  searchMarketplaceProducts,
  getMarketplaceCategories,
} from "@/modules/catalog/repository";
import { getFeaturedStores } from "@/modules/marketplace/repository";
import { productSearchSchema } from "@/modules/catalog/validators";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { StoreCard } from "@/components/marketplace/StoreCard";
import { CurrencySelectField } from "@/components/payments/CurrencySelectField";

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
    merchant?: string;
  }>;
};

export default async function BrowsePage({ searchParams }: Props) {
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
    merchantSlug: rawParams.merchant,
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

  const [{ products, total }, categories, featuredStores] = await Promise.all([
    searchMarketplaceProducts(filters),
    getMarketplaceCategories(),
    getFeaturedStores(3),
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
    if (merged.merchantSlug) params.set("merchant", String(merged.merchantSlug));
    const query = params.toString();
    return query ? `/customer/browse?${query}` : "/customer/browse";
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Marketplace</h1>
          <p className="mt-2 text-muted">Discover products from Nexar merchants</p>
        </div>
        <Link
          href="/marketplace/stores"
          className="text-sm text-gold hover:underline"
        >
          Browse stores →
        </Link>
      </div>

      {featuredStores.length > 0 && !filters.q && filters.page === 1 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Featured Stores
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {featuredStores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        </section>
      )}

      <form className="mt-8 grid gap-3 rounded-2xl border border-border bg-card/20 p-4 md:grid-cols-2 lg:grid-cols-4">
        <input
          name="q"
          type="search"
          defaultValue={filters.q ?? ""}
          placeholder="Search products…"
          className="rounded-xl border border-border bg-surface/80 px-4 py-3 text-sm outline-none focus:border-gold/40 lg:col-span-2"
        />
        <select name="sort" defaultValue={filters.sort} className="rounded-xl border border-border bg-surface/80 px-3 py-3 text-sm">
          <option value="newest">Newest</option>
          <option value="featured">Featured</option>
          <option value="best_selling">Best Selling</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="name">Name</option>
        </select>
        <CurrencySelectField
          name="currency"
          defaultValue={filters.currency ?? ""}
          includeEmpty
          showLogo={Boolean(filters.currency)}
          className="rounded-xl border-border bg-surface/80 px-3 py-3 text-sm"
        />
        <input name="minPrice" type="number" step="0.01" placeholder="Min price" defaultValue={filters.minPrice ?? ""} className="rounded-xl border border-border bg-surface/80 px-3 py-3 text-sm" />
        <input name="maxPrice" type="number" step="0.01" placeholder="Max price" defaultValue={filters.maxPrice ?? ""} className="rounded-xl border border-border bg-surface/80 px-3 py-3 text-sm" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="stock" defaultChecked={filters.inStock} /> In stock only
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="sale" defaultChecked={filters.onSale} /> On sale
        </label>
        <button type="submit" className="rounded-xl border border-gold/30 bg-gold/10 px-6 py-3 text-sm font-medium text-gold lg:col-span-2">
          Apply filters
        </button>
      </form>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href={browseHref({ categorySlug: undefined, onSale: false, page: 1 })} className={`rounded-full px-3 py-1 text-xs ${!filters.categorySlug && !filters.onSale ? "bg-gold text-background" : "border border-border text-muted"}`}>
          All
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={browseHref({ categorySlug: category.slug, page: 1 })}
            className={`rounded-full px-3 py-1 text-xs ${filters.categorySlug === category.slug ? "bg-gold text-background" : "border border-border text-muted"}`}
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
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={browseHref({ page: p })} className={`rounded-lg px-3 py-1 text-sm ${p === filters.page ? "bg-gold text-background" : "border border-border text-muted"}`}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
