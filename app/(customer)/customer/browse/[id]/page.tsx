import Link from "next/link";
import { notFound } from "next/navigation";
import { getMarketplaceProductWithDetails } from "@/modules/catalog/repository";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { ProductImageGallery } from "@/components/catalog/ProductImageGallery";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getMarketplaceProductWithDetails(id);

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
        <ProductImageGallery
          images={product.images}
          fallbackUrl={product.image_url}
          alt={product.name}
        />

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
