import "server-only";

import { randomUUID } from "node:crypto";
import { publishDomainEvent, type DomainEvent } from "@/domains";
import type {
  AtlasMarketplacePort,
  MarketplaceListingRecord,
  MarketplaceStorefrontRecord,
} from "@/domains/contracts/ports";
import { createMarketplaceAiStub } from "./ai";
import { scoreListingRecommendations } from "./recommendations";
import {
  addFavorite,
  completeCheckoutRecord,
  createAdvertisementRecord,
  createCheckoutRecord,
  createCollectionRecord,
  createOrUpdateListing,
  createOfferRecord,
  createShipmentRecord,
  ensureBusinessStorefront,
  ensureListingForProduct,
  getListingById,
  getStorefrontByBusinessId,
  getStorefrontById,
  listPublishedListings,
  recordAiAction,
  recordMonetization,
  searchListings,
  updateShipmentStatus,
} from "./repository";
import type {
  CreateCheckoutInput,
  EnsureStorefrontInput,
  MarketplaceAiAction,
  MarketplaceListing,
  MarketplaceStorefront,
  PublishListingInput,
} from "./types";
import {
  createCheckoutSchema,
  createOfferSchema,
  createShipmentSchema,
  ensureStorefrontSchema,
  publishListingSchema,
  searchListingsSchema,
} from "./validators";

async function emit(
  name: DomainEvent["name"],
  input: {
    actorId: string | null;
    businessId: string | null;
    payload: Record<string, unknown>;
  },
) {
  await publishDomainEvent({
    id: randomUUID(),
    name,
    occurredAt: new Date(),
    actorId: input.actorId,
    businessId: input.businessId,
    payload: input.payload,
    correlationId: randomUUID(),
  });
}

function toStorefrontRecord(sf: MarketplaceStorefront): MarketplaceStorefrontRecord {
  return {
    id: sf.id,
    businessId: sf.business_id,
    storeId: sf.store_id,
    slug: sf.slug,
    displayName: sf.display_name,
    isPremium: sf.is_premium,
    isPublished: sf.is_published,
    listingCount: sf.listing_count,
  };
}

function toListingRecord(l: MarketplaceListing): MarketplaceListingRecord {
  return {
    id: l.id,
    storefrontId: l.storefront_id,
    businessId: l.business_id,
    productId: l.product_id,
    sellingType: l.selling_type,
    status: l.status,
    title: l.title,
    slug: l.slug,
    price: l.price,
    currency: l.currency,
    isFeatured: l.is_featured,
    publishedAt: l.published_at ? new Date(l.published_at) : null,
  };
}

export async function ensureMarketplaceStorefront(
  input: EnsureStorefrontInput,
): Promise<MarketplaceStorefrontRecord> {
  ensureStorefrontSchema.parse(input);
  const existing = await getStorefrontByBusinessId(input.businessId);
  const storefront = await ensureBusinessStorefront(input);

  if (!existing) {
    await emit("marketplace.storefront_created", {
      actorId: input.ownerUserId,
      businessId: input.businessId,
      payload: { storefrontId: storefront.id, slug: storefront.slug },
    });
  }

  return toStorefrontRecord(storefront);
}

export async function getBusinessStorefront(
  businessId: string,
): Promise<MarketplaceStorefrontRecord | null> {
  const sf = await getStorefrontByBusinessId(businessId);
  return sf ? toStorefrontRecord(sf) : null;
}

export async function publishListing(
  input: PublishListingInput,
): Promise<MarketplaceListingRecord> {
  publishListingSchema.parse(input);
  const listing = await createOrUpdateListing({ ...input, status: "published" });

  await emit("marketplace.listing_published", {
    actorId: input.actorUserId,
    businessId: input.businessId,
    payload: {
      listingId: listing.id,
      productId: listing.product_id,
      title: listing.title,
      sellingType: listing.selling_type,
    },
  });

  // Alias for Pulse / ecosystem consumers expecting product.published shape
  if (listing.product_id) {
    await emit("product.published", {
      actorId: input.actorUserId,
      businessId: input.businessId,
      payload: {
        productId: listing.product_id,
        name: listing.title,
        listingId: listing.id,
      },
    });
  }

  return toListingRecord(listing);
}

export async function listStorefrontListings(
  storefrontId: string,
  limit?: number,
): Promise<MarketplaceListingRecord[]> {
  const listings = await listPublishedListings({ storefrontId, limit });
  return listings.map(toListingRecord);
}

export async function searchMarketplace(input: {
  query: string;
  storefrontId?: string;
  businessId?: string;
  sellingType?: string;
  limit?: number;
}): Promise<MarketplaceListingRecord[]> {
  searchListingsSchema.parse(input);
  const listings = await searchListings(input);
  return listings.map(toListingRecord);
}

export async function createOffer(input: {
  storefrontId: string;
  listingId?: string;
  title: string;
  discountPercent?: number;
  discountAmount?: number;
  startsAt?: string;
  endsAt?: string;
  actorUserId?: string;
  businessId?: string;
}) {
  createOfferSchema.parse(input);
  const offer = await createOfferRecord(input);
  await emit("marketplace.offer_created", {
    actorId: input.actorUserId ?? null,
    businessId: input.businessId ?? null,
    payload: { offerId: offer.id, listingId: offer.listing_id },
  });
  return offer;
}

export async function createCollection(input: {
  storefrontId: string;
  businessId: string;
  name: string;
  slug: string;
  description?: string;
  actorUserId?: string;
}) {
  const collection = await createCollectionRecord(input);
  await emit("marketplace.collection_created", {
    actorId: input.actorUserId ?? null,
    businessId: input.businessId,
    payload: { collectionId: collection.id, slug: collection.slug },
  });
  return collection;
}

export async function startCheckout(input: CreateCheckoutInput) {
  createCheckoutSchema.parse(input);
  const checkout = await createCheckoutRecord(input);
  await emit("marketplace.checkout_started", {
    actorId: input.buyerUserId,
    businessId: input.businessId ?? null,
    payload: { checkoutId: checkout.id, cartId: checkout.cart_id },
  });
  return checkout;
}

export async function completeCheckout(input: {
  checkoutId: string;
  orderId: string;
  actorUserId?: string;
  businessId?: string;
}) {
  const checkout = await completeCheckoutRecord(input.checkoutId, input.orderId);
  await emit("marketplace.checkout_completed", {
    actorId: input.actorUserId ?? null,
    businessId: input.businessId ?? null,
    payload: { checkoutId: checkout.id, orderId: input.orderId },
  });
  return checkout;
}

export async function createShipment(input: {
  orderId: string;
  businessId?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  actorUserId?: string;
}) {
  createShipmentSchema.parse(input);
  const shipment = await createShipmentRecord(input);
  await emit("marketplace.shipment_created", {
    actorId: input.actorUserId ?? null,
    businessId: input.businessId ?? null,
    payload: {
      shipmentId: shipment.id,
      orderId: shipment.order_id,
      trackingNumber: shipment.tracking_number,
    },
  });
  return shipment;
}

export async function markShipmentShipped(input: {
  shipmentId: string;
  actorUserId?: string;
  businessId?: string;
}) {
  const shipment = await updateShipmentStatus(input.shipmentId, "shipped", {
    shippedAt: new Date().toISOString(),
  });
  await emit("marketplace.shipment_updated", {
    actorId: input.actorUserId ?? null,
    businessId: input.businessId ?? null,
    payload: { shipmentId: shipment.id, status: "shipped" },
  });
  return shipment;
}

export async function favoriteListing(input: {
  userId: string;
  listingId: string;
}) {
  await addFavorite(input);
  const listing = await getListingById(input.listingId);
  await emit("marketplace.favorite_added", {
    actorId: input.userId,
    businessId: listing?.business_id ?? null,
    payload: { listingId: input.listingId },
  });
}

export async function createSponsoredAd(input: {
  businessId: string;
  title: string;
  placement: string;
  listingId?: string;
  storefrontId?: string;
  budget?: number;
  endsAt?: string;
  actorUserId?: string;
}) {
  const ad = await createAdvertisementRecord(input);
  if (input.budget && input.budget > 0) {
    await recordMonetization({
      kind: "sponsored_product",
      amount: input.budget,
      businessId: input.businessId,
      listingId: input.listingId,
      storefrontId: input.storefrontId,
    });
  }
  await emit("marketplace.advertisement_created", {
    actorId: input.actorUserId ?? null,
    businessId: input.businessId,
    payload: { advertisementId: ad.id, placement: ad.placement },
  });
  return ad;
}

export async function runMarketplaceAi(input: {
  action: MarketplaceAiAction;
  businessId: string;
  listingId?: string;
  productId?: string;
  context?: Record<string, unknown>;
  actorUserId?: string;
}) {
  const result = createMarketplaceAiStub(input);
  await recordAiAction({
    action: input.action,
    businessId: input.businessId,
    listingId: input.listingId,
    createdBy: input.actorUserId,
    inputPayload: input.context,
    output: result.output,
  });

  if (input.action === "generate_description" && input.listingId) {
    // Persist stub description onto listing when present
    const listing = await getListingById(input.listingId);
    if (listing) {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      await createAdminClient()
        .from("atlas_marketplace_listings")
        .update({
          ai_description: String(result.output.description ?? ""),
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.listingId);
    }
  }

  return result;
}

export async function recommendListings(input: {
  storefrontId?: string;
  businessId?: string;
  recentCategoryIds?: string[];
  recentListingIds?: string[];
  limit?: number;
}) {
  const listings = await listPublishedListings({
    storefrontId: input.storefrontId,
    businessId: input.businessId,
    limit: 100,
  });
  return scoreListingRecommendations(
    {
      recentCategoryIds: input.recentCategoryIds,
      recentListingIds: input.recentListingIds,
      preferFeatured: true,
    },
    listings.map((l) => ({
      listingId: l.id,
      score: 50,
      sellingType: l.selling_type,
      categoryId: l.category_id,
      isFeatured: l.is_featured,
      isSponsored: l.is_sponsored,
    })),
  ).slice(0, input.limit ?? 10);
}

export async function handleMarketplaceDomainEvent(event: {
  name: string;
  actorId: string | null;
  businessId: string | null;
  payload: Record<string, unknown>;
}): Promise<void> {
  if (event.name === "product.published" || event.name === "product.created") {
    const productId = String(event.payload.productId ?? event.payload.id ?? "");
    const businessId = event.businessId;
    if (!productId || !businessId) return;
    await ensureListingForProduct({
      productId,
      businessId,
      storeId:
        typeof event.payload.storeId === "string"
          ? event.payload.storeId
          : undefined,
      name: String(event.payload.name ?? "Product"),
      description:
        typeof event.payload.description === "string"
          ? event.payload.description
          : null,
      price: Number(event.payload.price ?? 0),
      currency: String(event.payload.currency ?? "USD"),
      isActive: event.name === "product.published" || Boolean(event.payload.isActive),
    });
    return;
  }

  if (event.name === "order.paid" && event.businessId) {
    const orderId = String(event.payload.orderId ?? "");
    const amount = Number(event.payload.amount ?? event.payload.total ?? 0);
    if (amount > 0) {
      await recordMonetization({
        kind: "commission",
        amount: amount * 0.05,
        businessId: event.businessId,
        orderId: orderId || undefined,
        metadata: { rate: 0.05, source: "order.paid" },
      });
    }
  }
}

export function createAtlasMarketplacePort(): AtlasMarketplacePort {
  return {
    async getStorefront(businessId) {
      return getBusinessStorefront(businessId);
    },
    async ensureStorefront(input) {
      return ensureMarketplaceStorefront(input);
    },
    async publishListing(input) {
      return publishListing({
        storefrontId: input.storefrontId,
        businessId: input.businessId,
        productId: input.productId,
        sellingType: input.sellingType as PublishListingInput["sellingType"],
        title: input.title,
        slug: input.slug,
        summary: input.summary,
        price: input.price,
        currency: input.currency,
        actorUserId: input.actorUserId,
      });
    },
    async listListings(storefrontId, limit) {
      return listStorefrontListings(storefrontId, limit);
    },
    async search(input) {
      return searchMarketplace(input);
    },
    async startCheckout(input) {
      const checkout = await startCheckout(input as CreateCheckoutInput);
      return { checkoutId: checkout.id, status: checkout.status };
    },
    async recommend(input) {
      return recommendListings(input);
    },
  };
}

export { createMarketplaceAiStub, MARKETPLACE_AI_ACTIONS } from "./ai";
export { scoreListingRecommendations } from "./recommendations";
export { getListingById, getStorefrontById };
