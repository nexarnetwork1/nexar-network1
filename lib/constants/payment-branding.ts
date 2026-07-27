/** Official payment & currency branding for marketplace UI */

export type CurrencyCode =
  | "NXR"
  | "BNB"
  | "USDT"
  | "BTC"
  | "ETH"
  | "USD"
  | "EUR"
  | "EGP";

export type PaymentMethodCode =
  | "nxr"
  | "bnb"
  | "usdt"
  | "btc"
  | "eth"
  | "visa"
  | "mastercard"
  | "apple_pay"
  | "google_pay"
  | "card";

export const CURRENCY_META: Record<
  string,
  { label: string; symbol: string; logo: "nxr" | "crypto" | "fiat" }
> = {
  NXR: { label: "Nexar", symbol: "NXR", logo: "nxr" },
  BNB: { label: "BNB", symbol: "BNB", logo: "crypto" },
  USDT: { label: "Tether", symbol: "USDT", logo: "crypto" },
  BTC: { label: "Bitcoin", symbol: "BTC", logo: "crypto" },
  ETH: { label: "Ethereum", symbol: "ETH", logo: "crypto" },
  USD: { label: "US Dollar", symbol: "$", logo: "fiat" },
  EUR: { label: "Euro", symbol: "€", logo: "fiat" },
  EGP: { label: "Egyptian Pound", symbol: "E£", logo: "fiat" },
};

export const PAYMENT_METHOD_META: Record<
  PaymentMethodCode,
  { label: string; currencies?: string[] }
> = {
  nxr: { label: "NXR", currencies: ["NXR"] },
  bnb: { label: "BNB", currencies: ["BNB"] },
  usdt: { label: "USDT", currencies: ["USDT"] },
  btc: { label: "Bitcoin", currencies: ["BTC"] },
  eth: { label: "Ethereum", currencies: ["ETH"] },
  visa: { label: "Visa" },
  mastercard: { label: "Mastercard" },
  apple_pay: { label: "Apple Pay" },
  google_pay: { label: "Google Pay" },
  card: { label: "Card" },
};

/** Resolve accepted payment methods from store settings */
export function getStorePaymentMethods(settings: {
  accepts_crypto: boolean;
  accepts_card: boolean;
  default_currency?: string;
}): PaymentMethodCode[] {
  const methods: PaymentMethodCode[] = ["nxr", "bnb", "usdt"];
  if (settings.accepts_crypto) {
    methods.push("btc", "eth");
  }
  if (settings.accepts_card) {
    methods.push("visa", "mastercard", "apple_pay", "google_pay");
  }
  return methods;
}

export function getCurrencyMeta(code: string) {
  return CURRENCY_META[code.toUpperCase()] ?? {
    label: code,
    symbol: code,
    logo: "fiat" as const,
  };
}
