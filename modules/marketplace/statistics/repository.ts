import { createClient } from "@/lib/supabase/server";
import {
  globalCommerceStatisticsSchema,
  marketplaceStatisticsSchema,
  merchantAnalyticsSchema,
} from "./validators";

function emptyGlobalStats() {
  return {
    total_users: 0,
    total_merchants: 0,
    total_customers: 0,
    verified_stores: 0,
    total_products: 0,
    total_orders: 0,
    paid_orders: 0,
    sales_volume_usd: 0,
    nxr_payments: 0,
    usdt_payments: 0,
    countries_active: 0,
    new_stores_7d: 0,
    computed_at: new Date().toISOString(),
  };
}

function emptyMarketplaceStats() {
  return {
    latest_products: [],
    trending_products: [],
    featured_stores: [],
    approved_brands: [],
    computed_at: new Date().toISOString(),
  };
}

function warnUnavailable(label: string, message: string) {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[commerce] ${label} unavailable:`, message);
  }
}

function parseGlobalStats(data: unknown) {
  const parsed = globalCommerceStatisticsSchema.safeParse(data);
  if (parsed.success) return parsed.data;
  warnUnavailable("get_global_commerce_statistics", "Invalid RPC payload shape");
  return globalCommerceStatisticsSchema.parse(emptyGlobalStats());
}

function parseMarketplaceStats(data: unknown) {
  const parsed = marketplaceStatisticsSchema.safeParse(data);
  if (parsed.success) return parsed.data;
  warnUnavailable("get_marketplace_statistics", "Invalid RPC payload shape");
  return marketplaceStatisticsSchema.parse(emptyMarketplaceStats());
}

export async function getGlobalCommerceStatistics() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_global_commerce_statistics");
  if (error || data == null) {
    if (error) warnUnavailable("get_global_commerce_statistics", error.message);
    return parseGlobalStats(emptyGlobalStats());
  }
  return parseGlobalStats(data);
}

export async function getMarketplaceStatistics(limit = 12) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_marketplace_statistics", {
    p_limit: limit,
  });
  if (error || data == null) {
    if (error) warnUnavailable("get_marketplace_statistics", error.message);
    return parseMarketplaceStats(emptyMarketplaceStats());
  }
  return parseMarketplaceStats(data);
}

export async function getMerchantCommerceAnalytics(storeId: string, days = 30) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_merchant_commerce_analytics", {
    p_store_id: storeId,
    p_days: days,
  });
  if (error) throw error;
  const parsed = merchantAnalyticsSchema.parse(data);
  if (parsed.error === "forbidden") {
    throw new Error("Forbidden");
  }
  return parsed;
}

export async function getLiveCommerceMetrics() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("commerce_live_metrics")
    .select("payload, updated_at")
    .eq("id", "global")
    .single();
  if (error || !data) {
    if (error) warnUnavailable("commerce_live_metrics", error.message);
    return { payload: {}, updated_at: new Date().toISOString() };
  }
  return data;
}
