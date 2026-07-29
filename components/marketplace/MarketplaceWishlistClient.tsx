"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { resolveWishlistProductsAction } from "@/modules/wishlist/actions";
import { useWishlist } from "@/components/marketplace/WishlistProvider";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { Button } from "@/components/ui/Button";
import type { ProductWithStore } from "@/types";

export function MarketplaceWishlistClient() {
  const { ids, ready } = useWishlist();
  const [products, setProducts] = useState<Array<{ productId: string; product: ProductWithStore }>>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      const resolved = await resolveWishlistProductsAction(ids);
      if (!cancelled) {
        setProducts(resolved);
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [ids, ready]);

  if (!ready || loading) {
    return <p className="mt-8 text-muted">Loading wishlist…</p>;
  }

  if (ids.length === 0) {
    return (
      <div className="mt-12 rounded-2xl border border-border bg-card/40 p-12 text-center">
        <p className="text-muted">Your wishlist is empty.</p>
        <Link href="/marketplace/browse" className="mt-4 inline-block">
          <Button variant="secondary">Browse marketplace</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map(({ productId, product }) => (
          <li key={productId}>
            <ProductCard product={product} productBasePath="/marketplace/products" />
          </li>
        ))}
      </ul>
      <div className="mt-8 rounded-2xl border border-border bg-card/20 p-6 text-center">
        <p className="text-sm text-muted">
          Sign in to save your wishlist across devices and sync with your account.
        </p>
        <Link
          href={`/login?redirect=${encodeURIComponent("/customer/wishlist")}`}
          className="mt-4 inline-block"
        >
          <Button>Sign in</Button>
        </Link>
      </div>
    </>
  );
}
