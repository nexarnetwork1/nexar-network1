import { formatUnits, parseUnits } from "viem";

/** NXR from USDT amount — matches NexarPresale.on-chain formula */
export function nxrFromUsdt(
  usdtAmountWei: bigint,
  priceNumerator: bigint,
  priceDenominator: bigint
): bigint {
  if (priceDenominator === BigInt(0)) return BigInt(0);
  return (usdtAmountWei * priceDenominator) / priceNumerator;
}

/** NXR from BNB amount using Chainlink BNB/USD price (8 decimals) */
export function nxrFromBnb(
  bnbAmountWei: bigint,
  bnbUsdPrice: bigint,
  priceNumerator: bigint,
  priceDenominator: bigint
): bigint {
  // usdtValue (18 dec) = bnbWei * bnbPrice / 1e8
  const usdtValue = (bnbAmountWei * bnbUsdPrice) / BigInt(1e8);
  return nxrFromUsdt(usdtValue, priceNumerator, priceDenominator);
}

export function formatNxr(amountWei: bigint): number {
  return Number(formatUnits(amountWei, 18));
}

export function parseUsdtAmount(amount: string, decimals: number): bigint {
  const trimmed = amount.trim();
  if (!trimmed || isNaN(Number(trimmed)) || Number(trimmed) <= 0) return BigInt(0);
  return parseUnits(trimmed, decimals);
}

export function parseBnbAmount(amount: string): bigint {
  const trimmed = amount.trim();
  if (!trimmed || isNaN(Number(trimmed)) || Number(trimmed) <= 0) return BigInt(0);
  return parseUnits(trimmed, 18);
}

export type BuyValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export function validatePurchase(params: {
  nxrAmount: bigint;
  minPurchase: bigint;
  maxPurchase: bigint;
  purchased: bigint;
  totalSold: bigint;
  hardCap: bigint;
  isLive: boolean;
  isConnected: boolean;
  isCorrectChain: boolean;
  chainName?: string;
}): BuyValidationResult {
  if (!params.isConnected) return { valid: false, error: "Connect your wallet to purchase" };
  if (!params.isCorrectChain) {
    const network = params.chainName ?? "the correct network";
    return { valid: false, error: `Switch to ${network}` };
  }
  if (!params.isLive) return { valid: false, error: "Presale is not active" };
  if (params.nxrAmount === BigInt(0)) return { valid: false, error: "Enter a valid amount" };
  if (params.nxrAmount < params.minPurchase) {
    return {
      valid: false,
      error: `Minimum purchase is ${formatUnits(params.minPurchase, 18)} NXR`,
    };
  }
  if (params.purchased + params.nxrAmount > params.maxPurchase) {
    return {
      valid: false,
      error: `Maximum wallet purchase is ${formatUnits(params.maxPurchase, 18)} NXR`,
    };
  }
  if (params.totalSold + params.nxrAmount > params.hardCap) {
    return { valid: false, error: "Purchase exceeds remaining hard cap" };
  }
  return { valid: true };
}

/** Reverse: USDT wei from NXR amount */
export function usdtFromNxr(
  nxrAmountWei: bigint,
  priceNumerator: bigint,
  priceDenominator: bigint
): bigint {
  if (priceDenominator === BigInt(0) || priceNumerator === BigInt(0)) return BigInt(0);
  return (nxrAmountWei * priceNumerator) / priceDenominator;
}

/** Reverse: BNB wei from NXR amount using Chainlink BNB/USD (8 decimals) */
export function bnbFromNxr(
  nxrAmountWei: bigint,
  bnbUsdPrice: bigint,
  priceNumerator: bigint,
  priceDenominator: bigint
): bigint {
  if (bnbUsdPrice === BigInt(0)) return BigInt(0);
  const usdtValue = usdtFromNxr(nxrAmountWei, priceNumerator, priceDenominator);
  return (usdtValue * BigInt(1e8)) / bnbUsdPrice;
}

export function parseNxrAmount(amount: string): bigint {
  const trimmed = amount.trim();
  if (!trimmed || isNaN(Number(trimmed)) || Number(trimmed) <= 0) return BigInt(0);
  return parseUnits(trimmed, 18);
}

export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "00:00:00";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}
