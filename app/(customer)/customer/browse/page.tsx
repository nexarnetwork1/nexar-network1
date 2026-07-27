import Link from "next/link";
import {
  searchMarketplaceProducts,
  getMarketplaceCategories,
} from "@/modules/catalog/repository";
import { productSearchSchema } from "@/modules/catalog/validators";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { ProductPrice } from "@/components/catalog/ProductPrice";

type Props = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    category?: string;
    sort?: string;
    sale?: string;
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
    limit: 20,
  });

  const { q, page, limit, categorySlug, sort, onSale } = parsed.success
    ? parsed.data
    : {
        q: undefined,
        page: 1,
        limit: 20,
        categorySlug: undefined,
        sort: "newest" as const,
        onSale: false,
      };

  const [{ products, total }, categories] = await Promise.all([
    searchMarketplaceProducts({ q, page, limit, categorySlug, sort, onSale }),
    getMarketplaceCategories(),
  ]);

  const totalPages = Math.ceil(total / limit);

  function browseHref(options?: {
    page?: number;
    category?: string;
    sort?: string;
    sale?: boolean;
  }) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const nextPage = options?.page ?? page;
    const nextCategory = options?.category ?? categorySlug;
    const nextSort = options?.sort ?? sort;
    const nextSale = options?.sale ?? onSale;

    if (nextPage > 1) params.set("page", String(nextPage));
    if (nextCategory) params.set("category", nextCategory);
    if (nextSort && nextSort !== "newest") params.set("sort", nextSort);
    if (nextSale) params.set("sale", "true");

    const query = params.toString();
    return query ? `/customer/browse?${query}` : "/customer/browse";
  }

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold">Browse products</h1>
      <p className="mt-2 text-muted">Discover products from Nexar marketplace merchants</p>

      <form className="mt-8 flex flex-wrap gap-3">
        <input
          name="q"
          type="search"
          defaultValue={q ?? ""}
          placeholder="Search products…"
          className="min-w-[200px] flex-1 rounded-xl border border-border bg-surface/80 px-4 py-3 text-sm text-white outline-none focus:border-gold/40"
        />
        {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
        {onSale && <input type="hidden" name="sale" value="true" />}
        <select
          name="sort"
          defaultValue={sort}
          className="rounded-xl border border-border bg-surface/80 px-3 py-3 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="name">Name</option>
        </select>
        <button
          type="submit"
          className="rounded-xl border border-gold/30 bg-gold/10 px-6 py-3 text-sm font-medium text-gold hover:bg-gold/20"
        >
          Search
        </button>
      </form>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href={browseHref({ page: 1, category: undefined, sale: false })}
          className={`rounded-full px-3 py-1 text-xs ${
            !categorySlug && !onSale
              ? "bg-gold text-background"
              : "border border-border text-muted hover:text-white"
          }`}
        >
          All
        </Link>
        <Link
          href={browseHref({ page: 1, category: undefined, sale: true })}
          className={`rounded-full px-3 py-1 text-xs ${
            onSale
              ? "bg-emerald-500 text-background"
              : "border border-border text-muted hover:text-white"
          }`}
        >
          On sale
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={browseHref({ page: 1, category: category.slug })}
            className={`rounded-full px-3 py-1 text-xs ${
              categorySlug === category.slug
                ? "bg-gold text-background"
                : "border border-border text-muted hover:text-white"
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
            <article
              key={product.id}
              className="overflow-hidden rounded-2xl border border-border bg-card/40 transition-colors hover:border-gold/20"
            >
              <Link href={`/customer/browse/${product.id}`} className="relative block">
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-surface text-muted">
                    No image
                  </div>
                )}
                {product.is_on_sale && (
                  <span className="absolute left-3 top-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold uppercase text-background">
                    Sale
                  </span>
                )}
              </Link>
              <div className="p-4">
                <p className="text-xs text-muted">{product.store.name}</p>
                <Link href={`/customer/browse/${product.id}`}>
                  <h2 className="mt-1 font-medium hover:text-gold">{product.name}</h2>
                </Link>
                <ProductPrice
                  price={Number(product.price)}
                  compareAtPrice={product.compare_at_price}
                  currency={product.currency}
                  showBadge
                />
                <div className="mt-4">
                  <AddToCartButton productId={product.id} stock={product.stock} />
                </div>
              </div>
            </article>
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
                p === page
                  ? "bg-gold text-background"
                  : "border border-border text-muted hover:text-white"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
