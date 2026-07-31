export const platformFeesConfig = {
  /** NXR payments — 0.35% platform fee */
  nxrFeePercent: 0.35,
  /** Other supported crypto — 0.5% platform fee */
  cryptoFeePercent: 0.5,
  /** Card payments */
  cardFeePercent: 3.5,
  minFeeAmount: 0.01,
  currency: "USD",
} as const;
