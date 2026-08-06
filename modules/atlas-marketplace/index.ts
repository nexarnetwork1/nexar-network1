/**
 * ATLAS Marketplace — Commerce Engine (sales channel).
 * Never owns Product or Store masters — Business Hub does.
 */

export type {
  MarketplaceStorefront,
  MarketplaceListing,
  MarketplaceSellingType,
  MarketplaceListingStatus,
  MarketplacePaymentMethod,
  MarketplaceAiAction,
  EnsureStorefrontInput,
  PublishListingInput,
  CreateCheckoutInput,
} from "./types";

export {
  MARKETPLACE_CONSUMES,
  MARKETPLACE_EVENT_HANDLERS,
} from "./types";

export {
  ensureMarketplaceStorefront,
  getBusinessStorefront,
  publishListing,
  listStorefrontListings,
  searchMarketplace,
  createOffer,
  createCollection,
  startCheckout,
  completeCheckout,
  createShipment,
  markShipmentShipped,
  favoriteListing,
  createSponsoredAd,
  runMarketplaceAi,
  recommendListings,
  handleMarketplaceDomainEvent,
  createAtlasMarketplacePort,
  createMarketplaceAiStub,
  MARKETPLACE_AI_ACTIONS,
  scoreListingRecommendations,
} from "./service";

export { registerAtlasMarketplaceEventHandlers } from "./events";

export {
  ensureStorefrontSchema,
  publishListingSchema,
  createCheckoutSchema,
  searchListingsSchema,
} from "./validators";
