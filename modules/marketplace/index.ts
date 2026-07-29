/**
 * Marketplace domain — Shopify-level foundation (catalog, cart, checkout, discovery).
 * Presentation/UI layers will consume these bounded contexts via ports + application services.
 */

export * from "./shared/constants";
export * from "./shared/types";
export * from "./shared/errors";
export * from "./shared/config";

export * as catalog from "./catalog";
export * as cart from "./cart";
export * as checkout from "./checkout";
export * as wishlist from "./wishlist";
export * as reviews from "./reviews";
export * as discovery from "./discovery";
export * as storefront from "./storefront";
export * as moderation from "./moderation";
export * as realtime from "./realtime";
