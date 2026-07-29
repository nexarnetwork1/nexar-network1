/** Feature flags and defaults for the marketplace domain. */
export const marketplaceConfig = {
  defaultPageSize: 24,
  maxPageSize: 100,
  minSearchQueryLength: 2,
  guestCartStorageKey: "nexar:marketplace:guest-cart",
  guestWishlistStorageKey: "nexar:marketplace:guest-wishlist",
  productHandleField: "slug" as const,
  enableRealtimeInventory: true,
  enableRealtimeCart: true,
} as const;
