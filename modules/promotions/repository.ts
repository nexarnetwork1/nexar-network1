import { createClient } from "@/lib/supabase/server";
import type { MerchantPromotion } from "@/types";

export async function getActiveStorePromotion(
  storeId: string
): Promise<MerchantPromotion | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("merchant_promotions")
    .select("*")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data as MerchantPromotion | null;
}

export async function getStorePromotions(
  storeId: string
): Promise<MerchantPromotion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("merchant_promotions")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as MerchantPromotion[];
}
