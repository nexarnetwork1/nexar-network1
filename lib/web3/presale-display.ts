/** UI display constant — presale hard cap (100M NXR). Sold amounts still read from chain. */
export const PRESALE_DISPLAY_HARD_CAP_NXR = 100_000_000;

export function getPresaleDisplayMetrics(soldAmount: number) {
  const capAmount = PRESALE_DISPLAY_HARD_CAP_NXR;
  const remainingAmount = Math.max(0, capAmount - soldAmount);
  const progress =
    capAmount > 0 ? Math.min((soldAmount / capAmount) * 100, 100) : 0;
  return { capAmount, remainingAmount, progress };
}

/** Presale calculator: 100 NXR = 1 USDT (display & input sync). */
export const PRESALE_NXR_PER_USDT = 100;

export function usdtFromNxrDisplay(nxrAmount: number): number {
  if (!Number.isFinite(nxrAmount) || nxrAmount <= 0) return 0;
  return nxrAmount / PRESALE_NXR_PER_USDT;
}

export function nxrFromUsdtDisplay(usdtAmount: number): number {
  if (!Number.isFinite(usdtAmount) || usdtAmount <= 0) return 0;
  return usdtAmount * PRESALE_NXR_PER_USDT;
}
