/**
 * ATLAS Marketplace — Zod validators.
 */

import { z } from "zod";

export const sellingTypeSchema = z.enum([
  "physical",
  "digital",
  "service",
  "rental",
  "subscription",
  "wholesale",
  "auction",
  "nft",
]);

export const listingStatusSchema = z.enum([
  "draft",
  "pending_review",
  "published",
  "paused",
  "archived",
  "rejected",
]);

export const paymentMethodSchema = z.enum([
  "wallet",
  "card",
  "bank",
  "crypto",
  "nxr",
  "cash",
  "split",
]);

export const ensureStorefrontSchema = z.object({
  businessId: z.string().uuid(),
  ownerUserId: z.string().uuid(),
  displayName: z.string().min(1).max(300),
  slug: z.string().min(1).max(120),
  storeId: z.string().uuid().optional(),
});

export const publishListingSchema = z.object({
  storefrontId: z.string().uuid(),
  businessId: z.string().uuid(),
  productId: z.string().uuid().optional(),
  sellingType: sellingTypeSchema,
  title: z.string().min(1).max(300),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
  summary: z.string().max(2000).optional(),
  price: z.number().nonnegative().optional(),
  currency: z.string().min(3).max(8).optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  actorUserId: z.string().uuid(),
});

export const createCheckoutSchema = z.object({
  buyerUserId: z.string().uuid(),
  storefrontId: z.string().uuid().optional(),
  businessId: z.string().uuid().optional(),
  cartId: z.string().uuid().optional(),
  paymentMethod: paymentMethodSchema.optional(),
  couponCode: z.string().max(64).optional(),
  subtotal: z.number().nonnegative().optional(),
  discountTotal: z.number().nonnegative().optional(),
  total: z.number().nonnegative().optional(),
  currency: z.string().min(3).max(8).optional(),
});

export const createShipmentSchema = z.object({
  orderId: z.string().uuid(),
  businessId: z.string().uuid().optional(),
  carrier: z.string().max(120).optional(),
  trackingNumber: z.string().max(200).optional(),
  trackingUrl: z.string().url().optional(),
});

export const createOfferSchema = z.object({
  storefrontId: z.string().uuid(),
  listingId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  discountPercent: z.number().min(0).max(100).optional(),
  discountAmount: z.number().nonnegative().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});

export const searchListingsSchema = z.object({
  query: z.string().min(1).max(200),
  storefrontId: z.string().uuid().optional(),
  businessId: z.string().uuid().optional(),
  sellingType: sellingTypeSchema.optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const marketplaceAiActionSchema = z.enum([
  "generate_description",
  "generate_seo",
  "suggest_price",
  "predict_sales",
  "recommend_products",
  "detect_fraud",
  "optimize_inventory",
]);
