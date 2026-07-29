"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProductWithStore } from "@/types";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { ProductPrice } from "@/components/catalog/ProductPrice";
import { Button } from "@/components/ui/Button";
import { WishlistButton } from "@/components/marketplace/WishlistButton";
import { ShareProductButton } from "@/components/marketplace/ShareProductButton";
import { MoveToCartButton } from "@/components/marketplace/MoveToCartButton";

type ProductCardProps = {
  product: ProductWithStore;
  showNewBadge?: boolean;
  productBasePath?: string;
  showMoveToCart?: boolean;
  ratingSummary?: { avg: number; count: number };
};

export function ProductCard({
  product,
  showNewBadge,
  productBasePath = "/marketplace/products",
  showMoveToCart = false,
  ratingSummary,
}: ProductCardProps) {
  const [now] = useState(() => Date.now());
  const isNew =
    showNewBadge ??
    now - new Date(product.created_at).getTime() < 14 * 86400000;

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card/40 transition hover:border-gold/25 hover:shadow-lg hover:shadow-black/20">
      <Link href={`${productBasePath}/${product.id}`} className="relative block">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex aspect-square items-center justify-center bg-surface text-muted">
            No image
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1">
          {product.is_on_sale && (
            <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold uppercase text-background">
              Sale
            </span>
          )}
          {isNew && (
            <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold uppercase text-background">
              New
            </span>
          )}
        </div>
        {product.stock <= 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
            Out of stock
          </span>
        )}
      </Link>

      <div className="p-4">
        <Link
          href={`/store/${product.store.slug}`}
          className="flex items-center gap-2 text-xs text-muted hover:text-gold"
        >
          {product.store.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.store.logo_url} alt="" className="h-5 w-5 rounded-full object-cover" />
          )}
          {product.store.name}
        </Link>

        <Link href={`${productBasePath}/${product.id}`}>
          <h2 className="mt-1 font-medium leading-snug hover:text-gold">{product.name}</h2>
        </Link>

        <div className="mt-2 flex items-center gap-2 text-xs text-amber-400">
          {ratingSummary && ratingSummary.count > 0 ? (
            <>
              <span>★ {ratingSummary.avg}</span>
              <span className="text-muted">({ratingSummary.count})</span>
            </>
          ) : (
            <span className="text-muted">No reviews yet</span>
          )}
          <span className="text-muted">·</span>
          <span className="text-muted capitalize">
            {product.stock > 0 ? "In stock" : "Out of stock"}
          </span>
        </div>

        <ProductPrice
          price={Number(product.price)}
          compareAtPrice={product.compare_at_price}
          currency={product.currency}
          showBadge
        />

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="col-span-1">
            {showMoveToCart ? (
              <MoveToCartButton productId={product.id} stock={product.stock} />
            ) : (
              <AddToCartButton productId={product.id} stock={product.stock} />
            )}
          </div>
          <Link href={`${productBasePath}/${product.id}`} className="col-span-1">
            <Button type="button" variant="secondary" className="w-full">
              View Details
            </Button>
          </Link>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2">
          <WishlistButton productId={product.id} />
          <ShareProductButton
            productId={product.id}
            productName={product.name}
            productBasePath={productBasePath}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted hover:text-white"
          />
        </div>
      </div>
    </article>
  );
}
