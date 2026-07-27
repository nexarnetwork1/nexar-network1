import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoreBySlug } from "@/modules/stores/repository";
import { searchMarketplaceProducts } from "@/modules/catalog/repository";
import { ProductPrice } from "@/components/catalog/ProductPrice";

type Props = { params: Promise<{ slug: string }> };

export default async function PublicStorePage({ params }: Props) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);

  if (!store || store.mode !== "marketplace") {
    notFound();
  }

  const { products } = await searchMarketplaceProducts({
    storeSlug: slug,
    page: 1,
    limit: 12,
    sort: "newest",
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex items-center gap-4">
        {store.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.logo_url} alt="" className="h-16 w-16 rounded-xl object-cover" />
        )}
        <div>
          <h1 className="font-heading text-3xl font-semibold">{store.name}</h1>
          <p className="text-muted capitalize">{store.business_type ?? "Marketplace store"}</p>
        </div>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/customer/browse/${product.id}`}
            className="rounded-2xl border border-border bg-card/40 p-4 transition hover:border-gold/30"
          >
            <h2 className="font-medium">{product.name}</h2>
            <ProductPrice
              price={Number(product.price)}
              compareAtPrice={product.compare_at_price}
              currency={product.currency}
              size="sm"
            />
          </Link>
        ))}
      </div>

      {products.length === 0 && (
        <p className="mt-12 text-center text-muted">No products listed yet.</p>
      )}

      <p className="mt-12 text-center text-sm text-muted">
        <Link href="/login" className="text-gold hover:underline">
          Sign in
        </Link>{" "}
        to purchase from this store.
      </p>
    </div>
  );
}
