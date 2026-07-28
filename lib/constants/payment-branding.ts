/** Official payment & currency branding — local assets in /public/payments */

export type CurrencyCode =
  | "NXR"
  | "BNB"
  | "USDT"
  | "USDC"
  | "BTC"
  | "ETH"
  | "SOL"
  | "XRP"
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
  | "card"
  | "crypto"
  | "crypto_other";

/** Checkout / invoice payment method codes (uppercase crypto + card) */
export type CheckoutPaymentMethod = "NXR" | "BNB" | "USDT" | "BTC" | "ETH" | "card";

export const CURRENCY_ASSETS: Record<string, string> = {
  NXR: "/logo.png",
  BNB: "/payments/bnb.svg",
  USDT: "/payments/usdt.svg",
  USDC: "/payments/usdc.svg",
  BTC: "/payments/btc.svg",
  ETH: "/payments/eth.svg",
  SOL: "/payments/sol.svg",
  XRP: "/payments/xrp.svg",
  USD: "/payments/usd.svg",
  EUR: "/payments/eur.svg",
  EGP: "/payments/eur.svg",
};

export const PAYMENT_METHOD_ASSETS: Record<PaymentMethodCode, string | null> = {
  nxr: CURRENCY_ASSETS.NXR,
  bnb: CURRENCY_ASSETS.BNB,
  usdt: CURRENCY_ASSETS.USDT,
  btc: CURRENCY_ASSETS.BTC,
  eth: CURRENCY_ASSETS.ETH,
  visa: "/payments/visa.svg",
  mastercard: "/payments/mastercard.svg",
  apple_pay: "/payments/apple-pay.svg",
  google_pay: "/payments/google-pay.svg",
  card: "/payments/visa.svg",
  crypto: CURRENCY_ASSETS.BNB,
  crypto_other: CURRENCY_ASSETS.BTC,
};

export const CURRENCY_META: Record<
  string,
  { label: string; symbol: string }
> = {
  NXR: { label: "Nexar", symbol: "NXR" },
  BNB: { label: "BNB", symbol: "BNB" },
  USDT: { label: "Tether", symbol: "USDT" },
  USDC: { label: "USD Coin", symbol: "USDC" },
  BTC: { label: "Bitcoin", symbol: "BTC" },
  ETH: { label: "Ethereum", symbol: "ETH" },
  SOL: { label: "Solana", symbol: "SOL" },
  XRP: { label: "XRP", symbol: "XRP" },
  USD: { label: "US Dollar", symbol: "USD" },
  EUR: { label: "Euro", symbol: "EUR" },
  EGP: { label: "Egyptian Pound", symbol: "EGP" },
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
  crypto: { label: "Crypto" },
  crypto_other: { label: "Other crypto" },
};

export const BRANDED_CURRENCIES = [
  "NXR",
  "BNB",
  "USDT",
  "USDC",
  "BTC",
  "ETH",
  "SOL",
  "XRP",
  "USD",
  "EUR",
] as const;

export const BRANDED_PAYMENT_METHODS: PaymentMethodCode[] = [
  "nxr",
  "bnb",
  "usdt",
  "btc",
  "eth",
  "visa",
  "mastercard",
  "apple_pay",
  "google_pay",
  "card",
];

export function getCurrencyMeta(code: string) {
  const upper = code.toUpperCase();
  return (
    CURRENCY_META[upper] ?? {
      label: upper,
      symbol: upper,
    }
  );
}

export function getCurrencyAsset(code: string): string {
  const upper = code.toUpperCase();
  return CURRENCY_ASSETS[upper] ?? CURRENCY_ASSETS.USD;
}

export function normalizePaymentMethodCode(raw: string): PaymentMethodCode {
  const key = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const map: Record<string, PaymentMethodCode> = {
    nxr: "nxr",
    bnb: "bnb",
    usdt: "usdt",
    btc: "btc",
    eth: "eth",
    visa: "visa",
    mastercard: "mastercard",
    apple_pay: "apple_pay",
    applepay: "apple_pay",
    google_pay: "google_pay",
    googlepay: "google_pay",
    card: "card",
    crypto: "crypto",
    crypto_other: "crypto_other",
    other_crypto: "crypto_other",
  };
  return map[key] ?? "card";
}

export function checkoutMethodToPaymentCode(method: string): PaymentMethodCode {
  if (method.toLowerCase() === "card") return "card";
  return normalizePaymentMethodCode(method);
}

export function getPaymentMethodAsset(method: string): string {
  const code = normalizePaymentMethodCode(method);
  return PAYMENT_METHOD_ASSETS[code] ?? PAYMENT_METHOD_ASSETS.card!;
}

export function getPaymentMethodLabel(method: string): string {
  const code = normalizePaymentMethodCode(method);
  return PAYMENT_METHOD_META[code]?.label ?? method;
}

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

/** Decimal places for display by currency */
export function currencyDecimals(code: string, override?: number): number {
  if (override != null) return override;
  const upper = code.toUpperCase();
  if (["NXR", "BNB", "USDT", "USDC", "BTC", "ETH", "SOL", "XRP"].includes(upper)) {
    return upper === "BTC" || upper === "ETH" ? 6 : upper === "USDT" ? 2 : 4;
  }
  return 2;
}
