export type PaymentProviderKind = "crypto" | "card";

export type InitiatePaymentContext = {
  invoiceId: string;
  method: string;
  amountUsd: number;
  customerId: string;
};

export type PaymentProvider = {
  code: string;
  kind: PaymentProviderKind;
  label: string;
  isAvailable: () => boolean;
  supportedAssets: readonly string[];
};

const cryptoAssets = ["NXR", "BNB", "USDT", "BTC", "ETH"] as const;
const cardBrands = ["visa", "mastercard", "apple_pay", "google_pay"] as const;

export const cryptoProvider: PaymentProvider = {
  code: "crypto",
  kind: "crypto",
  label: "Cryptocurrency",
  isAvailable: () => Boolean(process.env.PAYMENT_MASTER_SEED),
  supportedAssets: cryptoAssets,
};

export const stripeProvider: PaymentProvider = {
  code: "stripe",
  kind: "card",
  label: "Card (Stripe)",
  isAvailable: () =>
    Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
  supportedAssets: cardBrands,
};

export const paymentProviders: PaymentProvider[] = [cryptoProvider, stripeProvider];

export function getAvailableProviders(): PaymentProvider[] {
  return paymentProviders.filter((provider) => provider.isAvailable());
}

export function getCryptoAssets(activeOnly = true): readonly string[] {
  if (!activeOnly) return cryptoAssets;
  // BSC-native assets active today; BTC/ETH reserved for future chain adapters
  return ["NXR", "BNB", "USDT"] as const;
}

export function isFutureCryptoAsset(asset: string): boolean {
  return asset === "BTC" || asset === "ETH";
}
