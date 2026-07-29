import { MARKETPLACE_REALTIME } from "../shared/constants";

export { MARKETPLACE_REALTIME };

/** Supabase Realtime channel helpers — wire subscriptions in presentation layer. */
export const marketplaceRealtimeChannels = {
  catalogUpdates: MARKETPLACE_REALTIME.catalog,
  cartForCustomer: MARKETPLACE_REALTIME.cart,
  inventoryForProduct: MARKETPLACE_REALTIME.inventory,
} as const;

export type MarketplaceRealtimeChannel =
  (typeof marketplaceRealtimeChannels)[keyof typeof marketplaceRealtimeChannels];
