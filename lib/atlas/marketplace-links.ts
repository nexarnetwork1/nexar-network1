import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";
import type { EnrichedMarketplaceListing } from "@/modules/atlas-marketplace/types";
import type { StorefrontProduct } from "@/modules/marketplace/storefront/types";

/** Canonical commerce product URL for an ATLAS marketplace listing. */
export function listingProductHref(listing: Pick<EnrichedMarketplaceListing, "product_slug" | "slug" | "id">): string {
  const handle = listing.product_slug ?? listing.slug ?? listing.id;
  return MARKETPLACE_ROUTES.product(handle);
}

/** Adapt listing rows to the existing StorefrontProductCard shape. */
export function listingToStorefrontProduct(
  listing: EnrichedMarketplaceListing,
): StorefrontProduct {
  const imageUrl =
    listing.product_image_url ??
    (typeof listing.metadata?.image_url === "string" ? listing.metadata.image_url : null);

  return {
    id: listing.product_id ?? listing.id,
    store_id: listing.storefront_id,
    business_id: listing.business_id,
    name: listing.title,
    description: listing.summary,
    price: listing.price ?? 0,
    compare_at_price: listing.compare_at_price,
    currency: listing.currency,
    image_url: imageUrl,
    stock: 1,
    category_id: listing.category_id,
    is_active: true,
    is_on_sale:
      listing.compare_at_price != null &&
      listing.price != null &&
      listing.compare_at_price > listing.price,
    slug: listing.product_slug ?? listing.slug,
    created_at: listing.created_at,
    updated_at: listing.updated_at,
    store: {
      id: listing.storefront_id,
      name: "",
      slug: "",
      logo_url: null,
    },
  };
}
