import Link from "next/link";
import { searchMarketplaceProducts } from "@/modules/catalog/repository";
import { productSearchSchema } from "@/modules/catalog/validators";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function BrowsePage({ searchParams }: Props) {
  const rawParams = await searchParams;
  const parsed = productSearchSchema.safeParse({
    q: rawParams.q,
    page: rawParams.page,
    limit: 20,
  });

  const { q, page, limit } = parsed.success
    ? parsed.data
    : { q: undefined, page: 1, limit: 20 };

  const { products, total } = await searchMarketplaceProducts({ q, page, limit });

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold">Browse products</h1>
      <p className="mt-2 text-muted">Discover products from Nexar marketplace merchants</p>

      <form className="mt-8 flex gap-3">
        <input
          name="q"
          type="search"
          defaultValue={q ?? ""}
          placeholder="Search products…"
          className="flex-1 rounded-xl border border-border bg-surface/80 px-4 py-3 text-sm text-white outline-none focus:border-gold/40"
        />
        <button
          type="submit"
          className="rounded-xl border border-gold/30 bg-gold/10 px-6 py-3 text-sm font-medium text-gold hover:bg-gold/20"
        >
          Search
        </button>
      </form>

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
              <Link href={`/customer/browse/${product.id}`}>
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
              </Link>
              <div className="p-4">
                <p className="text-xs text-muted">{product.store.name}</p>
                <Link href={`/customer/browse/${product.id}`}>
                  <h2 className="mt-1 font-medium hover:text-gold">{product.name}</h2>
                </Link>
                <p className="mt-2 font-heading text-lg text-gold">
                  {product.currency} {Number(product.price).toFixed(2)}
                </p>
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
              href={`/customer/browse?page=${p}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
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
