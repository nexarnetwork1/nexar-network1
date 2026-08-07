"use client";

import type { EnrichedMarketplaceListing } from "@/modules/atlas-marketplace/types";
import { StorefrontProductCard } from "@/components/storefront/StorefrontProductCard";
import { listingToStorefrontProduct } from "@/lib/atlas/marketplace-links";

type MarketplaceListingCardProps = {
  listing: EnrichedMarketplaceListing;
  index?: number;
};

/** Reuses Nexar Commerce StorefrontProductCard for ATLAS marketplace listings. */
export function MarketplaceListingCard({ listing, index = 0 }: MarketplaceListingCardProps) {
  return (
    <StorefrontProductCard product={listingToStorefrontProduct(listing)} index={index} />
  );
}
