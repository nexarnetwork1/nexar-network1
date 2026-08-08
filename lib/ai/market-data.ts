import { CONTRACTS, SITE } from "@/lib/constants/site";
import { exchangeRatesConfig } from "@/config/exchange-rates";

export type NxrMarketSnapshot = {
  symbol: string;
  priceUsd: number | null;
  change24h: number | null;
  source: "coingecko" | "unavailable";
  fetchedAt: string;
  contractAddress: string;
  note?: string;
};

export type CurrencyConversion = {
  amount: number;
  symbol: string;
  priceUsd: number;
  conversions: Array<{ currency: string; value: number }>;
  fetchedAt: string;
  source: string;
};

const CACHE_TTL_MS = exchangeRatesConfig.cacheTtlSeconds * 1000;
let cachedSnapshot: { at: number; data: NxrMarketSnapshot } | null = null;

/** Live NXR price via CoinGecko BSC contract lookup (server-side only). */
export async function fetchNxrMarketSnapshot(): Promise<NxrMarketSnapshot> {
  const now = Date.now();
  if (cachedSnapshot && now - cachedSnapshot.at < CACHE_TTL_MS) {
    return cachedSnapshot.data;
  }

  const contract = CONTRACTS.token.toLowerCase();
  const url =
    `https://api.coingecko.com/api/v3/simple/token_price/binance-smart-chain` +
    `?contract_addresses=${contract}` +
    `&vs_currencies=usd` +
    `&include_24hr_change=true`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: exchangeRatesConfig.cacheTtlSeconds },
    });

    if (!res.ok) {
      return cacheAndReturn(unavailableSnapshot(`CoinGecko returned ${res.status}`));
    }

    const json = (await res.json()) as Record<
      string,
      { usd?: number; usd_24h_change?: number }
    >;
    const row = json[contract];
    if (!row?.usd) {
      return cacheAndReturn(
        unavailableSnapshot(
          "NXR is not listed with a live USD price on CoinGecko. Check the Market page for presale and contract details.",
        ),
      );
    }

    const data: NxrMarketSnapshot = {
      symbol: SITE.ticker,
      priceUsd: row.usd,
      change24h: typeof row.usd_24h_change === "number" ? row.usd_24h_change : null,
      source: "coingecko",
      fetchedAt: new Date().toISOString(),
      contractAddress: CONTRACTS.token,
    };
    cachedSnapshot = { at: now, data };
    return data;
  } catch {
    return cacheAndReturn(unavailableSnapshot("Unable to reach the market data provider."));
  }
}

function unavailableSnapshot(note: string): NxrMarketSnapshot {
  return {
    symbol: SITE.ticker,
    priceUsd: null,
    change24h: null,
    source: "unavailable",
    fetchedAt: new Date().toISOString(),
    contractAddress: CONTRACTS.token,
    note,
  };
}

function cacheAndReturn(data: NxrMarketSnapshot): NxrMarketSnapshot {
  cachedSnapshot = { at: Date.now(), data };
  return data;
}

/** Convert NXR amount to fiat using live NXR USD price + CoinGecko FX rates. */
export async function convertNxrAmount(
  amount: number,
  targetCurrencies: string[] = ["USD", "EUR", "EGP", "GBP", "AED"],
): Promise<CurrencyConversion | null> {
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const snapshot = await fetchNxrMarketSnapshot();
  if (snapshot.priceUsd == null) return null;

  const normalized = targetCurrencies.map((c) => c.toUpperCase());
  let rates: Record<string, number> = { USD: 1 };
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/exchange_rates", {
      headers: { Accept: "application/json" },
      next: { revalidate: exchangeRatesConfig.cacheTtlSeconds },
    });
    if (res.ok) {
      const json = (await res.json()) as {
        rates?: Record<string, { value: number }>;
      };
      const usdPerBtc = json.rates?.usd?.value;
      if (usdPerBtc) {
        for (const code of normalized) {
          if (code === "USD") {
            rates.USD = 1;
            continue;
          }
          const entry = json.rates?.[code.toLowerCase()];
          if (entry?.value) {
            rates[code] = entry.value / usdPerBtc;
          }
        }
      }
    }
  } catch {
    // FX optional — USD still works
  }

  const usdValue = amount * snapshot.priceUsd;
  const conversions = normalized
    .filter((c) => rates[c] != null)
    .map((currency) => ({
      currency,
      value: currency === "USD" ? usdValue : usdValue * (rates[currency] ?? 1),
    }));

  if (!conversions.length) {
    conversions.push({ currency: "USD", value: usdValue });
  }

  return {
    amount,
    symbol: SITE.ticker,
    priceUsd: snapshot.priceUsd,
    conversions,
    fetchedAt: snapshot.fetchedAt,
    source: snapshot.source,
  };
}

export function formatMarketSnapshotForModel(snapshot: NxrMarketSnapshot): string {
  if (snapshot.priceUsd == null) {
    return `NXR live price unavailable. ${snapshot.note ?? ""} Contract: ${snapshot.contractAddress}. Market page: /market`;
  }
  const change =
    snapshot.change24h != null
      ? `24h change: ${snapshot.change24h >= 0 ? "+" : ""}${snapshot.change24h.toFixed(2)}%`
      : "";
  return `NXR live price: $${snapshot.priceUsd.toFixed(6)} USD. ${change}. Source: CoinGecko. Fetched: ${snapshot.fetchedAt}. Contract: ${snapshot.contractAddress}.`;
}

export function formatConversionForModel(conversion: CurrencyConversion): string {
  const lines = conversion.conversions.map(
    (c) => `${conversion.amount} ${conversion.symbol} ≈ ${c.value.toFixed(2)} ${c.currency}`,
  );
  return `NXR price used: $${conversion.priceUsd.toFixed(6)} USD (${conversion.source}).\n${lines.join("\n")}\nFetched: ${conversion.fetchedAt}`;
}
