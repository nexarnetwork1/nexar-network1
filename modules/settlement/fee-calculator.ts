import { createAdminClient } from "@/lib/supabase/admin";

export type FeeResult = {
  platformFee: number;
  merchantAmount: number;
  feeRate: number;
  promotionId: string | null;
};

export async function calculatePlatformFee(
  amountUsd: number,
  method: string,
  storeId: string
): Promise<FeeResult> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("calculate_platform_fee", {
    p_amount: amountUsd,
    p_method: method,
    p_store_id: storeId,
  });

  if (error || !data?.[0]) {
    const baseRate =
      method.toUpperCase() === "NXR"
        ? 0.0035
        : method.toLowerCase() === "card"
          ? 0.035
          : 0.005;
    return {
      platformFee: amountUsd * baseRate,
      merchantAmount: amountUsd * (1 - baseRate),
      feeRate: baseRate,
      promotionId: null,
    };
  }

  const row = data[0] as {
    platform_fee: number;
    merchant_amount: number;
    fee_rate: number;
    promotion_id: string | null;
  };

  return {
    platformFee: Number(row.platform_fee),
    merchantAmount: Number(row.merchant_amount),
    feeRate: Number(row.fee_rate),
    promotionId: row.promotion_id,
  };
}

export async function getExchangeRate(asset: string): Promise<number> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("exchange_rates")
    .select("rate")
    .eq("base_currency", asset)
    .eq("quote_currency", "USD")
    .order("fetched_at", { ascending: false })
    .limit(1)
    .single();

  return data ? Number(data.rate) : 1;
}

export function usdToCrypto(amountUsd: number, rateUsd: number): number {
  if (rateUsd <= 0) return amountUsd;
  return amountUsd / rateUsd;
}
