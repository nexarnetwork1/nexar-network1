import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getMarketplaceProductWithDetails,
  searchMarketplaceProducts,
} from "@/modules/catalog/repository";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { ProductImageGallery } from "@/components/catalog/ProductImageGallery";
import { ProductPrice } from "@/components/catalog/ProductPrice";
import { ProductDetailClient } from "@/components/marketplace/ProductDetailClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getMarketplaceProductWithDetails(id);

  if (!product) notFound();

  const { products: relatedRaw } = await searchMarketplaceProducts({
    page: 1,
    limit: 8,
    sort: "newest",
    onSale: false,
    inStock: false,
  });

  const related = relatedRaw
    .filter((p) => p.id !== product.id)
    .filter(
      (p) =>
        p.category_id === product.category_id || p.store_id === product.store_id
    )
    .slice(0, 4)
    .map((p) => ({ ...p, images: [] }));

  return (
    <ProductDetailClient product={product} related={related}>
      <Link href="/customer/browse" className="text-sm text-muted hover:text-gold">
        ← Back to marketplace
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <ProductImageGallery
          images={product.images}
          fallbackUrl={product.image_url}
          alt={product.name}
        />

        <div>
          <Link
            href={`/store/${product.store.slug}`}
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-gold"
          >
            {product.store.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.store.logo_url} alt="" className="h-6 w-6 rounded-full object-cover" />
            )}
            {product.store.name}
          </Link>
          <h1 className="mt-2 font-heading text-4xl font-semibold">{product.name}</h1>

          <ProductPrice
            price={Number(product.price)}
            compareAtPrice={product.compare_at_price}
            currency={product.currency}
            size="lg"
          />

          <p className="mt-2 flex items-center gap-2 text-sm text-muted">
            <span>{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</span>
          </p>

          <p className="mt-1 text-xs text-muted">SKU: {product.id.slice(0, 8).toUpperCase()}</p>

          {product.description && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                Description
              </h2>
              <p className="mt-2 leading-7 text-muted">{product.description}</p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <AddToCartButton productId={product.id} stock={product.stock} showQuantity />
            <Link
              href={`/store/${product.store.slug}`}
              className="inline-flex items-center rounded-xl border border-border px-5 py-2.5 text-sm hover:border-gold/30"
            >
              Visit Store
            </Link>
          </div>
        </div>
      </div>
    </ProductDetailClient>
  );
}
