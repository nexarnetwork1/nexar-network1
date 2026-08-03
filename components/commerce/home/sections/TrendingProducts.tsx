"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionShell } from "@/components/commerce/home/shared/SectionShell";
import { CommerceProductCard } from "@/components/commerce/home/shared/CommerceProductCard";
import { useMarketplaceStats } from "@/hooks/commerce/use-commerce-api";
import type { CommerceProduct } from "@/lib/commerce/types";
import { cn } from "@/lib/utils/cn";

type TrendingProductsProps = {
  initialTrending: CommerceProduct[];
  initialLatest: CommerceProduct[];
  initialTopRated: CommerceProduct[];
  initialFlashDeals: CommerceProduct[];
};

const TABS = [
  { id: "trending", label: "Trending" },
  { id: "newest", label: "Newest" },
  { id: "rated", label: "Top Rated" },
  { id: "sellers", label: "Best Sellers" },
  { id: "deals", label: "Flash Deals" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function TrendingProducts({
  initialTrending,
  initialLatest,
  initialTopRated,
  initialFlashDeals,
}: TrendingProductsProps) {
  const [active, setActive] = useState<TabId>("trending");
  const { data } = useMarketplaceStats(24);

  const trending =
    (data?.trending_products as CommerceProduct[] | undefined) ?? initialTrending;
  const latest =
    (data?.latest_products as CommerceProduct[] | undefined) ?? initialLatest;

  const productsByTab: Record<TabId, CommerceProduct[]> = {
    trending,
    newest: latest,
    rated: initialTopRated,
    sellers: trending,
    deals: initialFlashDeals,
  };

  const products = productsByTab[active] ?? [];

  const badgeMap: Partial<Record<TabId, "trending" | "new" | "rated" | "deal">> = {
    trending: "trending",
    newest: "new",
    rated: "rated",
    sellers: "trending",
    deals: "deal",
  };

  return (
    <SectionShell
      id="trending-products"
      title="Top Deals"
      description="Handpicked products from verified merchants — quality, trust, and value."
      align="center"
    >
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={cn(
              "rounded-[0.625rem] border px-4 py-2 text-xs font-semibold tracking-[0.08em] uppercase transition-all",
              active === tab.id
                ? "border-gold bg-gold text-background"
                : "border-border bg-card text-muted hover:border-gold/40 hover:text-white",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {products.length ? (
            products.slice(0, 8).map((product, i) => (
              <CommerceProductCard
                key={`${active}-${product.id}`}
                product={product}
                index={i}
                badge={badgeMap[active]}
              />
            ))
          ) : (
            <p className="col-span-full text-sm text-muted">
              No products in this view yet. Listings appear as merchants publish catalog items.
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </SectionShell>
  );
}
