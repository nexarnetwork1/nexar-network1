"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";
import { toggleWishlistAction } from "@/modules/marketplace/storefront/actions";
import { StorefrontProductGrid } from "@/components/storefront/StorefrontProductCard";
import { Button } from "@/components/ui/Button";
import type { StorefrontProduct } from "@/modules/marketplace/storefront/types";

type WishlistViewProps = {
  products: StorefrontProduct[];
  isAuthenticated: boolean;
};

export function WishlistView({ products: initialProducts, isAuthenticated }: WishlistViewProps) {
  const { openAuthModal } = useAuthModal();
  const [products, setProducts] = useState(initialProducts);
  const [pending, startTransition] = useTransition();

  if (!isAuthenticated) {
    return (
      <div className="rounded-3xl border border-border/70 bg-card/40 p-10 text-center">
        <Heart className="mx-auto h-10 w-10 text-gold/70" aria-hidden />
        <h2 className="mt-4 font-heading text-xl font-semibold text-white">Sign in to view your wishlist</h2>
        <p className="mt-2 text-sm text-muted">Save products you love and return anytime.</p>
        <Button
          className="mt-6"
          onClick={() => openAuthModal({ mode: "signin", redirect: MARKETPLACE_ROUTES.wishlist })}
        >
          Sign in
        </Button>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="rounded-3xl border border-border/70 bg-card/40 p-10 text-center">
        <Heart className="mx-auto h-10 w-10 text-gold/70" aria-hidden />
        <h2 className="mt-4 font-heading text-xl font-semibold text-white">Your wishlist is empty</h2>
        <p className="mt-2 text-sm text-muted">Tap the heart on any product to save it here.</p>
        <Link href={MARKETPLACE_ROUTES.shop} className="mt-6 inline-block">
          <Button>Browse shop</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <StorefrontProductGrid products={products} />
      <div className="mt-8 flex flex-wrap gap-3">
        {products.map((product) => (
          <Button
            key={product.id}
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await toggleWishlistAction(product.id);
                if (result.success && !result.inWishlist) {
                  setProducts((prev) => prev.filter((p) => p.id !== product.id));
                }
              })
            }
          >
            Remove {product.name.slice(0, 24)}
            {product.name.length > 24 ? "…" : ""}
          </Button>
        ))}
      </div>
    </div>
  );
}
