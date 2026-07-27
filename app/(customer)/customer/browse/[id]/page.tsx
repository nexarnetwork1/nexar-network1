import Link from "next/link";
import { notFound } from "next/navigation";
import { getMarketplaceProduct } from "@/modules/catalog/repository";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getMarketplaceProduct(id);

  if (!product) notFound();

  return (
    <div>
      <Link
        href="/customer/browse"
        className="text-sm text-muted hover:text-gold"
      >
        ← Back to browse
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="aspect-square w-full rounded-2xl object-cover"
          />
        ) : (
          <div className="flex aspect-square items-center justify-center rounded-2xl border border-border bg-surface text-muted">
            No image
          </div>
        )}

        <div>
          <p className="text-sm text-muted">{product.store.name}</p>
          <h1 className="mt-2 font-heading text-4xl font-semibold">{product.name}</h1>
          <p className="mt-4 font-heading text-3xl text-gold">
            {product.currency} {Number(product.price).toFixed(2)}
          </p>
          <p className="mt-2 text-sm text-muted">
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>

          {product.description && (
            <p className="mt-6 leading-7 text-muted">{product.description}</p>
          )}

          <div className="mt-8">
            <AddToCartButton
              productId={product.id}
              stock={product.stock}
              showQuantity
            />
          </div>
        </div>
      </div>
    </div>
  );
}
