// ============================================================
// NEXAR NETWORK - CENTRALIZED PRICE SERVICE
// Single source of truth for all pricing data across the platform
// ============================================================

import React from 'react';

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
  last_updated: string;
}

export interface CurrencyInfo {
  symbol: string;
  name: string;
  icon: string;
  decimals: number;
  type: 'crypto' | 'fiat';
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  NXR: {
    symbol: 'NXR',
    name: 'Nexar Network',
    icon: '/images/nxr-logo.png',
    decimals: 18,
    type: 'crypto',
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    icon: '/images/usdt-logo.png',
    decimals: 6,
    type: 'crypto',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    icon: '/images/usdc-logo.png',
    decimals: 6,
    type: 'crypto',
  },
  BNB: {
    symbol: 'BNB',
    name: 'BNB',
    icon: '/images/bnb-logo.png',
    decimals: 18,
    type: 'crypto',
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: '/images/eth-logo.png',
    decimals: 18,
    type: 'crypto',
  },
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: '/images/btc-logo.png',
    decimals: 8,
    type: 'crypto',
  },
  USD: {
    symbol: 'USD',
    name: 'US Dollar',
    icon: '/images/usd-logo.png',
    decimals: 2,
    type: 'fiat',
  },
  EUR: {
    symbol: 'EUR',
    name: 'Euro',
    icon: '/images/eur-logo.png',
    decimals: 2,
    type: 'fiat',
  },
  GBP: {
    symbol: 'GBP',
    name: 'British Pound',
    icon: '/images/gbp-logo.png',
    decimals: 2,
    type: 'fiat',
  },
};

class PriceService {
  private prices: Map<string, CryptoPrice> = new Map();
  private listeners: Set<() => void> = new Set();
  private lastUpdate: Date | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private isUpdating = false;

  constructor() {
    this.startAutoUpdate();
  }

  // Fetch prices from CoinGecko API
  private async fetchPrices(): Promise<void> {
    if (this.isUpdating) return;
    
    this.isUpdating = true;
    
    try {
      const url = 
        "https://api.coingecko.com/api/v3/coins/markets" +
        "?vs_currency=usd" +
        "&order=market_cap_desc" +
        "&per_page=100" +
        "&page=1" +
        "&sparkline=false" +
        "&price_change_percentage=24h";

      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`CoinGecko ${response.status}`);
      }

      const data: CryptoPrice[] = await response.json();

      // Update prices map
      data.forEach(crypto => {
        this.prices.set(crypto.symbol.toLowerCase(), crypto);
      });

      this.lastUpdate = new Date();
      this.notifyListeners();
      
    } catch (error) {
      console.error("Failed to fetch crypto prices:", error);
    } finally {
      this.isUpdating = false;
    }
  }

  // Start automatic price updates
  private startAutoUpdate(): void {
    // Initial fetch
    this.fetchPrices();
    
    // Update every 30 seconds
    this.updateInterval = setInterval(() => {
      this.fetchPrices();
    }, 30000);
  }

  // Stop automatic price updates
  public stopAutoUpdate(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Get price for a specific currency
  public getPrice(symbol: string): number | null {
    const key = symbol.toLowerCase();
    const price = this.prices.get(key);
    return price ? price.current_price : null;
  }

  // Get full price data for a currency
  public getPriceData(symbol: string): CryptoPrice | null {
    const key = symbol.toLowerCase();
    return this.prices.get(key) || null;
  }

  // Get price change percentage
  public getPriceChange(symbol: string): number | null {
    const key = symbol.toLowerCase();
    const price = this.prices.get(key);
    return price ? price.price_change_percentage_24h : null;
  }

  // Convert amount from one currency to another
  public convert(amount: number, fromSymbol: string, toSymbol: string): number {
    const fromPrice = this.getPrice(fromSymbol);
    const toPrice = this.getPrice(toSymbol);
    
    if (!fromPrice || !toPrice) return 0;
    
    // Convert to USD first, then to target currency
    const usdValue = amount * fromPrice;
    return usdValue / toPrice;
  }

  // Get fiat equivalent for a crypto amount
  public getFiatEquivalent(amount: number, cryptoSymbol: string, fiatSymbol: string = 'USD'): number {
    return this.convert(amount, cryptoSymbol, fiatSymbol);
  }

  // Get last update time
  public getLastUpdate(): Date | null {
    return this.lastUpdate;
  }

  // Check if prices are stale (older than 2 minutes)
  public isStale(): boolean {
    if (!this.lastUpdate) return true;
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    return this.lastUpdate < twoMinutesAgo;
  }

  // Subscribe to price updates
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners of price updates
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Force a price refresh
  public async refresh(): Promise<void> {
    await this.fetchPrices();
  }

  // Get all available prices
  public getAllPrices(): Map<string, CryptoPrice> {
    return new Map(this.prices);
  }

  // Get currency info
  public getCurrencyInfo(symbol: string): CurrencyInfo | null {
    return SUPPORTED_CURRENCIES[symbol] || null;
  }

  // Get all supported currencies
  public getSupportedCurrencies(): CurrencyInfo[] {
    return Object.values(SUPPORTED_CURRENCIES);
  }

  // Format price for display
  public formatPrice(price: number, currency: string = 'USD'): string {
    const currencyInfo = this.getCurrencyInfo(currency);
    if (!currencyInfo) return `$${price.toFixed(2)}`;

    if (currencyInfo.type === 'fiat') {
      return `${currency}${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    if (price >= 1) {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${price.toFixed(6)}`;
  }

  // Calculate crypto amount needed for fiat amount
  public cryptoAmountForFiat(fiatAmount: number, cryptoSymbol: string): number {
    const cryptoPrice = this.getPrice(cryptoSymbol);
    if (!cryptoPrice) return 0;
    return fiatAmount / cryptoPrice;
  }
}

// Singleton instance
export const priceService = new PriceService();

// React hook for using price service
export function usePriceService() {
  const [, forceUpdate] = React.useState(0);

  React.useEffect(() => {
    const unsubscribe = priceService.subscribe(() => {
      forceUpdate(prev => prev + 1);
    });
    return unsubscribe;
  }, []);

  return priceService;
}