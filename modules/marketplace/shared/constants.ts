/** Nexar Commerce unified marketplace routes. */
export const MARKETPLACE_ROUTES = {
  root: "/marketplace",
  shop: "/marketplace/shop",
  product: (handle: string) => `/marketplace/products/${handle}`,
  store: (slug: string) => `/marketplace/shop?store=${encodeURIComponent(slug)}`,
  cart: "/marketplace/cart",
  wishlist: "/marketplace/wishlist",
  checkout: "/marketplace/checkout",
} as const;

/** Versioned HTTP API base path. */
export const MARKETPLACE_API_V1 = "/api/marketplace/v1" as const;

/** Nexar Commerce enterprise API. */
export const COMMERCE_API_V1 = "/api/commerce/v1" as const;

export const MARKETPLACE_REALTIME = {
  catalog: "marketplace:catalog",
  cart: (customerId: string) => `marketplace:cart:${customerId}`,
  inventory: (productId: string) => `marketplace:inventory:${productId}`,
} as const;
