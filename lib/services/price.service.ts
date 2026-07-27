// ============================================================
// NEXAR NETWORK - PRICE SERVICE (Live Exchange Rates)
// Phase 5: Core Platform Implementation
// ============================================================

import { exchangeRateService, loggingService } from '@/lib/database';

interface ExchangeRateResponse {
  from_currency: string;
  to_currency: string;
  rate: number;
  timestamp: number;
}

interface PriceApiResponse {
  symbol: string;
  price: number;
  timestamp: number;
}

export class PriceService {
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static priceCache = new Map<string, { rate: number; timestamp: number }>();

  private static SUPPORTED_CURRENCIES = ['NXR', 'BNB', 'USDT', 'USDC', 'BTC', 'ETH', 'USD'];
  private static STABLE_COINS = ['USDT', 'USDC', 'DAI'];

  static async getExchangeRate(
    fromCurrency: string,
    toCurrency: string
  ): Promise<{ rate: number; timestamp: number }> {
    // Normalize currency codes
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    // Validate currencies
    if (!this.SUPPORTED_CURRENCIES.includes(from) || !this.SUPPORTED_CURRENCIES.includes(to)) {
      throw new Error(`Unsupported currency pair: ${from} to ${to}`);
    }

    // Check cache first
    const cacheKey = `${from}_${to}`;
    const cached = this.priceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return { rate: cached.rate, timestamp: cached.timestamp };
    }

    // Try database first
    const dbRate = await exchangeRateService.getExchangeRate(from, to);
    if (dbRate) {
      this.priceCache.set(cacheKey, { rate: dbRate.rate, timestamp: Date.now() });
      return { rate: dbRate.rate, timestamp: Date.now() };
    }

    // Fetch from external API
    const rate = await this.fetchExchangeRate(from, to);
    
    // Cache the result
    this.priceCache.set(cacheKey, { rate, timestamp: Date.now() });

    // Update database
    try {
      await exchangeRateService.createExchangeRate({
        from_currency: from,
        to_currency: to,
        rate,
        source: 'api',
      });
    } catch (error) {
      // Failed to save exchange rate to database, but still return the rate
    }

    return { rate, timestamp: Date.now() };
  }

  static async convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<{ amount: number; rate: number; timestamp: number }> {
    const { rate, timestamp } = await this.getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = amount * rate;

    return {
      amount: convertedAmount,
      rate,
      timestamp,
    };
  }

  static async getAllExchangeRates(): Promise<ExchangeRateResponse[]> {
    const rates: ExchangeRateResponse[] = [];
    const baseCurrency = 'USD';

    for (const currency of this.SUPPORTED_CURRENCIES) {
      if (currency === baseCurrency) continue;

      try {
        const { rate, timestamp } = await this.getExchangeRate(baseCurrency, currency);
        rates.push({
          from_currency: baseCurrency,
          to_currency: currency,
          rate,
          timestamp,
        });
      } catch (error) {
        // Failed to get exchange rate for this currency, skip it
      }
    }

    return rates;
  }

  private static async fetchExchangeRate(
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    // Handle stable coins (1:1 with USD)
    if (this.STABLE_COINS.includes(fromCurrency) && toCurrency === 'USD') {
      return 1.0;
    }
    if (this.STABLE_COINS.includes(toCurrency) && fromCurrency === 'USD') {
      return 1.0;
    }
    if (this.STABLE_COINS.includes(fromCurrency) && this.STABLE_COINS.includes(toCurrency)) {
      return 1.0;
    }

    // For NXR, use a fixed rate for now (in production, this would come from an oracle)
    if (fromCurrency === 'NXR' && toCurrency === 'USD') {
      return 1.0; // 1 NXR = 1 USD (example rate)
    }
    if (fromCurrency === 'USD' && toCurrency === 'NXR') {
      return 1.0; // 1 USD = 1 NXR (example rate)
    }

    // For crypto currencies, fetch from CoinGecko API
    try {
      return await this.fetchFromCoinGecko(fromCurrency, toCurrency);
    } catch (error) {
      // Fallback to database or default rates
      const fallbackRates: Record<string, number> = {
        'BTC_USD': 67000,
        'ETH_USD': 3500,
        'BNB_USD': 600,
        'USD_BTC': 1 / 67000,
        'USD_ETH': 1 / 3500,
        'USD_BNB': 1 / 600,
      };

      const fallbackKey = `${fromCurrency}_${toCurrency}`;
      if (fallbackRates[fallbackKey]) {
        return fallbackRates[fallbackKey];
      }

      throw new Error(`No exchange rate available for ${fromCurrency} to ${toCurrency}`);
    }
  }

  private static async fetchFromCoinGecko(
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    // Map our currency codes to CoinGecko IDs
    const coinGeckoIds: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'BNB': 'binancecoin',
      'USDT': 'tether',
      'USDC': 'usd-coin',
    };

    const coinId = coinGeckoIds[fromCurrency];
    if (!coinId) {
      throw new Error(`Unsupported currency for CoinGecko: ${fromCurrency}`);
    }

    // If target is USD, we can get the price directly
    if (toCurrency === 'USD') {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
      );

      if (!response.ok) {
        throw new Error('CoinGecko API error');
      }

      const data = await response.json();
      return data[coinId].usd;
    }

    // For non-USD pairs, we need to do a cross conversion
    const fromRate = await this.fetchFromCoinGecko(fromCurrency, 'USD');
    const toRate = await this.fetchFromCoinGecko(toCurrency, 'USD');

    return fromRate / toRate;
  }

  static async refreshExchangeRates(): Promise<void> {
    try {
      const rates = await this.getAllExchangeRates();

      // Clear cache
      this.priceCache.clear();

      // Log refresh
      await loggingService.createSystemLog({
        level: 'info',
        category: 'price_service',
        message: `Refreshed ${rates.length} exchange rates`,
      });

    } catch (error) {
      await loggingService.createSystemLog({
        level: 'error',
        category: 'price_service',
        message: `Failed to refresh exchange rates: ${error}`,
      });
    }
  }

  static async lockExchangeRateForInvoice(
    invoiceId: string,
    fromCurrency: string,
    toCurrency: string
  ): Promise<{ rate: number; lockedAt: number }> {
    const { rate, timestamp } = await this.getExchangeRate(fromCurrency, toCurrency);

    // Store the locked rate in the invoice metadata or a separate table
    // For now, we'll use the existing exchange rate update in the invoice

    return {
      rate,
      lockedAt: timestamp,
    };
  }

  static getSupportedCurrencies(): string[] {
    return [...this.SUPPORTED_CURRENCIES];
  }

  static clearCache(): void {
    this.priceCache.clear();
  }

  static getCacheSize(): number {
    return this.priceCache.size;
  }
}

// ============================================================
// PRICE UPDATE CRON JOB
// ============================================================

export async function updateExchangeRatesJob(): Promise<void> {
  try {
    await PriceService.refreshExchangeRates();
  } catch (error) {
    // Exchange rate update job failed, logged elsewhere
  }
}
