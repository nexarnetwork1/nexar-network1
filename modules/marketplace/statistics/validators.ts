import { z } from "zod";

export const globalCommerceStatisticsSchema = z.object({
  total_users: z.number(),
  total_merchants: z.number(),
  total_customers: z.number(),
  verified_stores: z.number(),
  total_products: z.number(),
  total_orders: z.number(),
  paid_orders: z.number(),
  sales_volume_usd: z.number(),
  nxr_payments: z.number(),
  usdt_payments: z.number(),
  countries_active: z.number(),
  new_stores_7d: z.number(),
  computed_at: z.string(),
});

export const marketplaceStatisticsSchema = z.object({
  latest_products: z.array(z.record(z.unknown())),
  trending_products: z.array(z.record(z.unknown())),
  featured_stores: z.array(z.record(z.unknown())),
  approved_brands: z.array(z.record(z.unknown())),
  computed_at: z.string(),
});

export const merchantAnalyticsSchema = z.object({
  revenue: z.number(),
  orders: z.number(),
  customers: z.number(),
  page_views: z.number(),
  add_to_carts: z.number(),
  conversions: z.number(),
  conversion_rate: z.number(),
  sales_chart: z.array(z.record(z.unknown())),
  top_products: z.array(z.record(z.unknown())),
  computed_at: z.string(),
  error: z.string().optional(),
});

export const analyticsEventSchema = z.object({
  storeId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  eventType: z.enum([
    "page_view",
    "product_view",
    "add_to_cart",
    "checkout_start",
    "purchase",
    "search",
  ]),
  sessionId: z.string().max(128).optional(),
  countryCode: z.string().length(2).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>;
