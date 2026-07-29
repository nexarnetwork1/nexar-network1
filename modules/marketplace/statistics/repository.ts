import { createClient } from "@/lib/supabase/server";
import {
  globalCommerceStatisticsSchema,
  marketplaceStatisticsSchema,
  merchantAnalyticsSchema,
} from "./validators";

export async function getGlobalCommerceStatistics() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_global_commerce_statistics");
  if (error) throw error;
  return globalCommerceStatisticsSchema.parse(data);
}

export async function getMarketplaceStatistics(limit = 12) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_marketplace_statistics", {
    p_limit: limit,
  });
  if (error) throw error;
  return marketplaceStatisticsSchema.parse(data);
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
  if (error) throw error;
  return data;
}
