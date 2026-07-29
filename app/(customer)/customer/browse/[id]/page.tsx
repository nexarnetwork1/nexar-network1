import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getMarketplaceProductWithDetails,
} from "@/modules/catalog/repository";
import {
  getSimilarProducts,
  getFrequentlyBoughtTogether,
  getRecommendedProducts,
} from "@/modules/marketplace/recommendations";
import {
  getProductReviews,
  getProductRatingSummary,
} from "@/modules/reviews/repository";
import { getCurrentProfile } from "@/modules/users/repository";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { BuyNowButton } from "@/components/orders/BuyNowButton";
import { ProductImageGallery } from "@/components/catalog/ProductImageGallery";
import { ProductPrice } from "@/components/catalog/ProductPrice";
import { ProductSpecificationsTable } from "@/components/catalog/ProductSpecificationsTable";
import { ProductDetailClient } from "@/components/marketplace/ProductDetailClient";
import { ProductReviews } from "@/components/reviews/ProductReviews";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ProductRecommendations } from "@/components/marketplace/ProductRecommendations";
import { ReportButton } from "@/components/security/ReportButton";
import { WishlistButton } from "@/components/marketplace/WishlistButton";
import { ShareProductButton } from "@/components/marketplace/ShareProductButton";
import { buildProductMetadata, buildProductJsonLd } from "@/lib/seo/marketplace";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getMarketplaceProductWithDetails(id);
  if (!product) return { title: "Product not found" };

  return buildProductMetadata({
    name: product.name,
    description: product.description,
    price: Number(product.price),
    currency: product.currency,
    imageUrl: product.image_url,
    storeName: product.store.name,
    productId: product.id,
  });
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getMarketplaceProductWithDetails(id);

  if (!product) notFound();

  const profile = await getCurrentProfile();

  const [similar, boughtTogether, recommended, reviews, ratingSummary] = await Promise.all([
    getSimilarProducts(product.id, product.category_id, product.store_id),
    getFrequentlyBoughtTogether(product.id),
    getRecommendedProducts(profile?.id ?? null),
    getProductReviews(product.id),
    getProductRatingSummary(product.id),
  ]);

  const specifications = (product.specifications ?? {}) as Record<string, string>;
  const jsonLd = buildProductJsonLd({
    name: product.name,
    description: product.description,
    price: Number(product.price),
    currency: product.currency,
    imageUrl: product.image_url,
    storeName: product.store.name,
    productId: product.id,
  });

  return (
    <ProductDetailClient product={product}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
              <img src={product.store.logo_url} alt="" className="h-6 w-6 rounded-full object-cover" loading="lazy" />
            )}
            {product.store.name}
          </Link>
          <h1 className="mt-2 font-heading text-4xl font-semibold">{product.name}</h1>

          {ratingSummary.count > 0 && (
            <p className="mt-2 text-sm text-amber-400">
              ★ {ratingSummary.avg} · {ratingSummary.count} review{ratingSummary.count !== 1 ? "s" : ""}
            </p>
          )}

          <ProductPrice
            price={Number(product.price)}
            compareAtPrice={product.compare_at_price}
            currency={product.currency}
            size="lg"
          />

          <p className="mt-2 text-sm text-muted">
            Available quantity:{" "}
            <span className="font-medium text-white">
              {product.stock > 0 ? product.stock : "Out of stock"}
            </span>
          </p>

          {product.description && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Description</h2>
              <p className="mt-2 leading-7 text-muted">{product.description}</p>
            </div>
          )}

          <ProductSpecificationsTable specifications={specifications} />

          <div className="mt-8 flex flex-wrap items-end gap-3">
            <AddToCartButton productId={product.id} stock={product.stock} showQuantity />
            <BuyNowButton productId={product.id} stock={product.stock} />
            <WishlistButton
              productId={product.id}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted transition hover:text-white"
            />
            <ShareProductButton
              productId={product.id}
              productName={product.name}
              productBasePath="/customer/browse"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted transition hover:text-white"
            />
            <Link
              href={`/store/${product.store.slug}`}
              className="inline-flex items-center rounded-xl border border-border px-5 py-2.5 text-sm hover:border-gold/30"
            >
              Visit Store
            </Link>
            <ReportButton targetType="product" targetId={product.id} label="Report product" />
          </div>
        </div>
      </div>

      <ProductReviews
        reviews={reviews}
        avgRating={ratingSummary.avg}
        count={ratingSummary.count}
        productId={product.id}
        storeId={product.store_id}
      />

      {profile && (
        <div className="mt-8">
          <ReviewForm productId={product.id} storeId={product.store_id} />
        </div>
      )}

      <ProductRecommendations title="Similar Products" products={similar} id="similar-heading" />
      <ProductRecommendations title="Frequently Bought Together" products={boughtTogether} id="fbt-heading" />
      <ProductRecommendations title="Recommended for You" products={recommended.filter((p) => p.id !== product.id).slice(0, 4)} id="rec-heading" />
    </ProductDetailClient>
  );
}
