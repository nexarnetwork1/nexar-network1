"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { CurrencyAmount } from "@/components/payments/CurrencyAmount";
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
                <Link
                  href={`/customer/browse/${p.id}`}
                  className="block rounded-xl border border-border bg-card/40 p-4 hover:border-gold/30"
                >
                  {p.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt="" className="mb-3 aspect-square w-full rounded-lg object-cover" />
                  )}
                  <p className="font-medium">{p.name}</p>
                  <CurrencyAmount amount={Number(p.price)} currency={p.currency} size={16} amountClassName="text-sm text-gold" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
