"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/marketplace/CartProvider";

type CartBadgeClientProps = {
  href?: string;
  className?: string;
  showIcon?: boolean;
};

export function CartBadgeClient({
  href = "/marketplace/cart",
  className,
  showIcon = false,
}: CartBadgeClientProps) {
  const { itemCount, ready, isAuthenticated } = useCart();
  const cartHref = isAuthenticated ? "/customer/cart" : href;

  if (!ready) return null;

  return (
    <Link
      href={cartHref}
      className={
        className ??
        "relative inline-flex items-center gap-1.5 text-muted transition-colors hover:text-white"
      }
    >
      {showIcon && <ShoppingCart className="h-4 w-4" />}
      Cart
      {itemCount > 0 && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-xs font-medium text-background">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
