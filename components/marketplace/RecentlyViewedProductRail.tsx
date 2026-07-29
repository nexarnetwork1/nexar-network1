"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { resolveMarketplaceProductsByIdsAction } from "@/modules/marketplace/actions";
import type { ProductWithStore } from "@/types";

const RECENT_KEY = "nxr_recently_viewed";

function readRecentlyViewedIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function RecentlyViewedProductRail() {
  const [products, setProducts] = useState<ProductWithStore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const ids = readRecentlyViewedIds();
      if (ids.length === 0) {
        if (!cancelled) {
          setProducts([]);
          setLoading(false);
        }
        return;
      }

      const resolved = await resolveMarketplaceProductsByIdsAction(ids);
      if (!cancelled) {
        setProducts(resolved);
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || products.length === 0) {
    return null;
  }

  return (
    <section className="py-10 sm:py-12">
      <div className="mb-6">
        <SectionHeading
          title="Recently Viewed"
          description="Pick up where you left off with products you opened recently."
          className="max-w-2xl"
        />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            productBasePath="/marketplace/products"
          />
        ))}
      </div>
    </section>
  );
}
