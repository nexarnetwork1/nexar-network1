import Link from "next/link";
import {
  searchMarketplaceStores,
  getFeaturedStores,
} from "@/modules/marketplace/repository";
import { getMarketplaceCategories } from "@/modules/catalog/repository";
import { StoreCard } from "@/components/marketplace/StoreCard";
import { MarketplaceEmptyState } from "@/components/marketplace/MarketplaceEmptyState";
import { MarketplaceArtwork } from "@/components/marketplace/MarketplaceArtwork";
import { DROPDOWN_CLASS } from "@/lib/constants/navigation";

type Props = {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    category?: string;
    page?: string;
  }>;
};

export default async function MarketplaceStoresPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const sort = (params.sort ?? "featured") as
    | "featured"
    | "top_rated"
    | "best_selling"
    | "newest"
    | "name";

  const [{ stores, total }, featured, categories] = await Promise.all([
    searchMarketplaceStores({
      q: params.q,
      sort,
      categorySlug: params.category,
      page,
      limit: 12,
    }),
    getFeaturedStores(4),
    getMarketplaceCategories(),
  ]);

  const totalPages = Math.ceil(total / 12);

  function href(options?: { page?: number; sort?: string; category?: string }) {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (options?.sort ?? sort !== "featured") sp.set("sort", options?.sort ?? sort);
    if (options?.category ?? params.category) sp.set("category", options?.category ?? params.category!);
    if ((options?.page ?? page) > 1) sp.set("page", String(options?.page ?? page));
    const q = sp.toString();
    return q ? `/marketplace/stores?${q}` : "/marketplace/stores";
  }

  return (
    <div className="relative min-h-screen">
      <MarketplaceArtwork />
      <div className="relative border-b border-border bg-surface/30 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <h1 className="font-heading text-3xl font-semibold md:text-4xl">Marketplace Stores</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Discover verified merchants, compare ratings, and shop with crypto or card.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/marketplace/browse" className="text-sm text-gold hover:underline">
              Browse all products →
            </Link>
            <Link href="/marketplace" className="text-sm text-muted hover:text-white">
              Marketplace home
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {featured.length > 0 && !params.q && page === 1 && (
          <section className="mb-12">
            <h2 className="font-heading text-xl font-semibold text-gold">Featured Stores</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          </section>
        )}

        <form className="flex flex-wrap gap-3">
          <input
            name="q"
            type="search"
            defaultValue={params.q ?? ""}
            placeholder="Search stores…"
            className="min-w-[200px] flex-1 rounded-xl border border-border/80 bg-card/70 px-4 py-3.5 text-sm shadow-lg shadow-black/10 backdrop-blur-xl outline-none transition focus:border-gold/40 focus:ring-2 focus:ring-gold/15"
          />
          <select name="sort" defaultValue={sort} className={DROPDOWN_CLASS}>
            <option value="featured">Featured</option>
            <option value="top_rated">Top Rated</option>
            <option value="best_selling">Best Selling</option>
            <option value="newest">Newest</option>
            <option value="name">Alphabetical</option>
          </select>
          <select name="category" defaultValue={params.category ?? ""} className={DROPDOWN_CLASS}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-xl border border-gold/30 bg-gold/10 px-6 py-3 text-sm font-medium text-gold"
          >
            Search
          </button>
        </form>

        {stores.length === 0 ? (
          <MarketplaceEmptyState hasFilters={Boolean(params.q || params.category)} />
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={href({ page: p })}
                className={`rounded-lg px-3 py-1 text-sm ${
                  p === page ? "bg-gold text-background" : "border border-border text-muted"
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
