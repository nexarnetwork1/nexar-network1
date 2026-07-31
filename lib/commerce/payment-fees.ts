import { platformFeesConfig } from "@/config/platform-fees";

/** Nexar Commerce platform fee rates (decimal, e.g. 0.0035 = 0.35%). */
export const NXR_PLATFORM_FEE_RATE = platformFeesConfig.nxrFeePercent / 100;
export const CRYPTO_PLATFORM_FEE_RATE = platformFeesConfig.cryptoFeePercent / 100;
export const CARD_PLATFORM_FEE_RATE = platformFeesConfig.cardFeePercent / 100;

export type CommercePaymentAsset = "NXR" | "USDT" | "USDC" | "BNB" | "ETH" | "BTC";

const CRYPTO_ASSETS = new Set<string>(["USDT", "USDC", "BNB", "ETH", "BTC", "SOL", "XRP"]);

/** Returns platform fee rate for a payment asset or method code. */
export function getPlatformFeeRate(assetOrMethod: string): number {
  const upper = assetOrMethod.toUpperCase();
  if (upper === "NXR") return NXR_PLATFORM_FEE_RATE;
  if (upper === "CARD") return CARD_PLATFORM_FEE_RATE;
  if (CRYPTO_ASSETS.has(upper)) return CRYPTO_PLATFORM_FEE_RATE;
  return CRYPTO_PLATFORM_FEE_RATE;
}

/** Calculates platform fee and merchant net for a gross USD amount. */
export function calculateCommercePlatformFee(
  amountUsd: number,
  assetOrMethod: string,
): { platformFee: number; merchantAmount: number; feeRate: number } {
  const feeRate = getPlatformFeeRate(assetOrMethod);
  const platformFee = Math.max(
    amountUsd * feeRate,
    amountUsd > 0 ? platformFeesConfig.minFeeAmount : 0,
  );
  return {
    platformFee,
    merchantAmount: Math.max(0, amountUsd - platformFee),
    feeRate,
  };
}

/** Human-readable fee label for UI (e.g. "0.35%"). */
export function formatPlatformFeePercent(assetOrMethod: string): string {
  const rate = getPlatformFeeRate(assetOrMethod);
  const percent = rate * 100;
  return `${percent % 1 === 0 ? percent.toFixed(0) : percent.toFixed(2)}%`;
}
