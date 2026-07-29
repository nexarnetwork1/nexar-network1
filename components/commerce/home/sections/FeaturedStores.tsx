"use client";

import { SectionShell } from "@/components/commerce/home/shared/SectionShell";
import { CommerceStoreCard } from "@/components/commerce/home/shared/CommerceStoreCard";
import type { CommerceStore } from "@/lib/commerce/types";

type FeaturedStoresProps = {
  initialStores: CommerceStore[];
};

export function FeaturedStores({ initialStores }: FeaturedStoresProps) {
  const stores = initialStores;

  return (
    <SectionShell
      id="featured-stores"
      eyebrow="Marketplace"
      title="Featured stores"
      description="Curated storefronts from active marketplace merchants — logos, banners, ratings, and follower counts from live database records."
    >
      {stores.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {stores.slice(0, 6).map((store, i) => (
            <CommerceStoreCard key={store.id} store={store} index={i} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">No featured stores yet. Merchant storefronts will appear here as they join.</p>
      )}
    </SectionShell>
  );
}
