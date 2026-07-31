"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Heart, ShieldCheck, Star } from "lucide-react";
import { useCommerceAuth } from "@/components/commerce/auth/NexarCommerceAuthProvider";
import { ProductImageGallery } from "@/components/catalog/ProductImageGallery";
import { ProductPrice } from "@/components/catalog/ProductPrice";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";
import { addToCartAction } from "@/modules/marketplace/cart";
import { buyNowAction } from "@/modules/orders/actions";
import {
  recordProductViewAction,
  submitProductReviewAction,
  toggleWishlistAction,
} from "@/modules/marketplace/storefront/actions";
import type { StorefrontProductDetail } from "@/modules/marketplace/storefront/types";
import { ProductShareButton } from "@/components/storefront/ProductShareButton";
import { StorefrontProductGrid } from "./StorefrontProductCard";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

type Props = {
  product: StorefrontProductDetail;
  isCustomer?: boolean;
  shareUrl?: string;
};

export function ProductDetailView({ product, isCustomer = false, shareUrl }: Props) {
  const { openCommerceAuth } = useCommerceAuth();
  const productPath = MARKETPLACE_ROUTES.product(product.slug || product.id);
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]?.id ?? null);
  const [inWishlist, setInWishlist] = useState(product.in_wishlist);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const variant = product.variants.find((v) => v.id === selectedVariant) ?? product.variants[0];
  const displayPrice = variant?.price ?? product.price;
  const displayStock = variant?.stock ?? product.stock;

  useEffect(() => {
    void recordProductViewAction(product.id);
  }, [product.id]);

  return (
    <div className="space-y-12">
      <div className="grid gap-8 lg:grid-cols-2">
        <ProductImageGallery
          images={product.images}
          fallbackUrl={product.image_url}
          alt={product.name}
        />

        <div>
          <Link
            href={MARKETPLACE_ROUTES.store(product.store.slug)}
            className="text-xs tracking-wide text-gold uppercase hover:underline"
          >
            {product.store.name}
          </Link>
          <h1 className="mt-2 font-heading text-3xl font-semibold text-white">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
            {(product.avg_rating ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 fill-gold text-gold" />
                {product.avg_rating} ({product.review_count} reviews)
              </span>
            )}
            {product.brand_name && <span>Brand: {product.brand_name}</span>}
            {product.marketplace_category_name && (
              <span>{product.marketplace_category_name}</span>
            )}
          </div>

          <div className="mt-6">
            <ProductPrice
              price={displayPrice}
              compareAtPrice={variant?.compare_at_price ?? product.compare_at_price}
              currency={product.currency}
            />
          </div>

          {product.variants.length > 1 && (
            <div className="mt-6">
              <p className="text-xs tracking-wide text-muted uppercase">Variants</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v.id)}
                    className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                      selectedVariant === v.id
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-border text-muted hover:text-white"
                    }`}
                  >
                    {v.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-border/60 bg-card/30 px-4 py-3">
              <dt className="text-xs text-muted">SKU</dt>
              <dd className="mt-1 font-mono text-white">{variant?.sku ?? "—"}</dd>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/30 px-4 py-3">
              <dt className="text-xs text-muted">Stock</dt>
              <dd className="mt-1 font-mono text-white">{displayStock}</dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {displayStock > 0 && isCustomer ? (
              <>
                <div className="inline-flex items-center rounded-full border border-border/70 bg-background/50">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1 || pending}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-2 text-muted hover:text-white"
                  >
                    −
                  </button>
                  <span className="min-w-[2rem] text-center text-sm">{quantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={quantity >= displayStock || pending}
                    onClick={() => setQuantity((q) => Math.min(displayStock, q + 1))}
                    className="px-3 py-2 text-muted hover:text-white"
                  >
                    +
                  </button>
                </div>
                <Button
                  size="lg"
                  disabled={pending}
                  onClick={() => {
                    setError(null);
                    setMessage(null);
                    startTransition(async () => {
                      const result = await addToCartAction(product.id, quantity);
                      if (!result.success) {
                        setError(result.error ?? "Could not add to cart");
                        return;
                      }
                      setMessage("Added to cart");
                    });
                  }}
                >
                  Add to cart
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => {
                    setError(null);
                    startTransition(async () => {
                      const result = await buyNowAction(product.id, quantity);
                      if (result && !result.success) {
                        setError(result.error ?? "Checkout failed");
                      }
                    });
                  }}
                >
                  Buy now
                </Button>
              </>
            ) : displayStock > 0 ? (
              <Button
                size="lg"
                onClick={() =>
                  openCommerceAuth({ mode: "signin", redirect: productPath })
                }
              >
                Sign in to purchase
              </Button>
            ) : (
              <Button size="lg" disabled>
                Out of stock
              </Button>
            )}
            <Button
              size="lg"
              variant="secondary"
              disabled={pending}
              onClick={() => {
                if (!isCustomer) {
                  openCommerceAuth({ mode: "signin", redirect: productPath });
                  return;
                }
                startTransition(async () => {
                  const result = await toggleWishlistAction(product.id);
                  if (result.success) setInWishlist(result.inWishlist ?? false);
                });
              }}
            >
              <Heart className={`h-4 w-4 ${inWishlist ? "fill-gold text-gold" : ""}`} />
              {inWishlist ? "Saved" : "Wishlist"}
            </Button>
            {shareUrl ? <ProductShareButton title={product.name} url={shareUrl} /> : null}
          </div>
          {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
          {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
          {isCustomer ? (
            <Link href={MARKETPLACE_ROUTES.cart} className="mt-3 inline-block text-sm text-gold hover:underline">
              View cart
            </Link>
          ) : null}

          {product.description && (
            <div className="mt-8">
              <h2 className="font-heading text-lg font-semibold">About this product</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      <ProductReviewsSection productId={product.id} reviews={product.reviews} />

      {product.related_products.length > 0 && (
        <section>
          <h2 className="font-heading text-xl font-semibold text-white">Related products</h2>
          <div className="mt-5">
            <StorefrontProductGrid
              products={product.related_products}
              storeSlug={product.store.slug}
            />
          </div>
        </section>
      )}
    </div>
  );
}

function ProductReviewsSection({
  productId,
  reviews,
}: {
  productId: string;
  reviews: StorefrontProductDetail["reviews"];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <section>
      <h2 className="font-heading text-xl font-semibold text-white">Reviews</h2>
      <form
        className="mt-4 rounded-2xl border border-border/70 bg-card/30 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            const fd = new FormData(e.currentTarget);
            fd.set("productId", productId);
            await submitProductReviewAction(fd);
            e.currentTarget.reset();
          });
        }}
      >
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer">
              <input type="radio" name="rating" value={n} className="peer sr-only" required />
              <Star className="h-5 w-5 text-muted peer-checked:fill-gold peer-checked:text-gold" />
            </label>
          ))}
        </div>
        <Textarea name="body" label="Review" rows={3} className="mt-3" required />
        <Button type="submit" size="sm" className="mt-3" disabled={pending}>
          Submit review
        </Button>
      </form>
      <ul className="mt-6 space-y-4">
        {reviews.map((review) => (
          <li key={review.id} className="rounded-xl border border-border/60 bg-surface/30 p-4">
            <div className="flex items-center gap-2">
              {Array.from({ length: review.rating }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-gold text-gold" />
              ))}
              {review.is_verified_purchase && (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                  <ShieldCheck className="h-3 w-3" />
                  Verified purchase
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-muted">{review.body}</p>
            {review.images?.length > 0 && (
              <div className="mt-3 flex gap-2">
                {review.images.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
