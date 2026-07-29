"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useWishlist } from "@/components/marketplace/WishlistProvider";

type WishlistBadgeClientProps = {
  href?: string;
  className?: string;
  showIcon?: boolean;
};

export function WishlistBadgeClient({
  href = "/marketplace/wishlist",
  className,
  showIcon = false,
}: WishlistBadgeClientProps) {
  const { ids, ready, isAuthenticated } = useWishlist();
  const wishlistHref = isAuthenticated ? "/customer/wishlist" : href;

  if (!ready) return null;

  return (
    <Link
      href={wishlistHref}
      className={
        className ??
        "relative inline-flex items-center gap-1.5 text-muted transition-colors hover:text-white"
      }
    >
      {showIcon && <Heart className="h-4 w-4" />}
      Wishlist
      {ids.length > 0 && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-xs font-medium text-background">
          {ids.length}
        </span>
      )}
    </Link>
  );
}
