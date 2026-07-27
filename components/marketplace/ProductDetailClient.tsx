"use client";

import { useEffect } from "react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { ProductCard } from "@/components/marketplace/ProductCard";
import type { ProductWithDetails, ProductWithStore } from "@/types";

type Props = {
  product: ProductWithDetails;
  related: ProductWithStore[];
  children: React.ReactNode;
};

export function ProductDetailClient({ product, related, children }: Props) {
  const { track } = useRecentlyViewed();

  useEffect(() => {
    track(product.id);
  }, [product.id, track]);

  return (
    <>
      {children}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-heading text-xl font-semibold">Related Products</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
