"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/components/marketplace/WishlistProvider";

type WishlistButtonProps = {
  productId: string;
  className?: string;
};

export function WishlistButton({ productId, className }: WishlistButtonProps) {
  const { has, toggle, ready } = useWishlist();
  const saved = has(productId);

  return (
    <button
      type="button"
      disabled={!ready}
      onClick={() => void toggle(productId)}
      className={
        className ??
        `flex h-9 w-9 items-center justify-center rounded-lg border border-border transition ${
          saved ? "border-red-400/50 text-red-400" : "text-muted hover:text-white"
        }`
      }
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={saved}
    >
      <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
    </button>
  );
}
