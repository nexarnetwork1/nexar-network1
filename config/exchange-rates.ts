export const exchangeRatesConfig = {
  cacheTtlSeconds: 300,
  defaultBaseCurrency: "USD",
  supportedCurrencies: ["USD", "EUR", "GBP", "AED"] as const,
  provider: "coingecko" as const,
} as const;
