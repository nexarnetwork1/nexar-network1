"use client";

import Link from "next/link";
import { Heart, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { ProductWithStore } from "@/types";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { ProductPrice } from "@/components/catalog/ProductPrice";
import { useWishlist } from "@/hooks/useWishlist";

type ProductCardProps = {
  product: ProductWithStore;
  showNewBadge?: boolean;
};

export function ProductCard({ product, showNewBadge }: ProductCardProps) {
  const { toggle, has } = useWishlist();
  const isNew =
    showNewBadge ??
    Date.now() - new Date(product.created_at).getTime() < 14 * 86400000;

  async function shareProduct() {
    const url = `${window.location.origin}/customer/browse/${product.id}`;
    if (navigator.share) {
      await navigator.share({ title: product.name, url }).catch(() => undefined);
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  }

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card/40 transition hover:border-gold/25 hover:shadow-lg hover:shadow-black/20">
      <Link href={`/customer/browse/${product.id}`} className="relative block">
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

        <Link href={`/customer/browse/${product.id}`}>
          <h2 className="mt-1 font-medium leading-snug hover:text-gold">{product.name}</h2>
        </Link>

        <div className="mt-2 flex items-center gap-2 text-xs text-amber-400">
          <span>★ 4.5</span>
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

        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1">
            <AddToCartButton productId={product.id} stock={product.stock} />
          </div>
          <button
            type="button"
            onClick={() => toggle(product.id)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border border-border transition ${
              has(product.id) ? "border-red-400/50 text-red-400" : "text-muted hover:text-white"
            }`}
            aria-label="Wishlist"
          >
            <Heart className={`h-4 w-4 ${has(product.id) ? "fill-current" : ""}`} />
          </button>
          <button
            type="button"
            onClick={shareProduct}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted hover:text-white"
            aria-label="Share"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>

        <Link
          href={`/customer/browse/${product.id}`}
          className="mt-3 block text-center text-xs text-gold hover:underline"
        >
          View Details
        </Link>
      </div>
    </article>
  );
}
