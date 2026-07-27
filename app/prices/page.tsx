"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { RefreshCw, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ExchangeRate {
  from_currency: string;
  to_currency: string;
  rate: number;
  timestamp: number;
}

export default function PricesPage() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  useEffect(() => {
    fetchRates();
    // Refresh rates every 5 minutes
    const interval = setInterval(fetchRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchRates = async () => {
    try {
      const response = await fetch('/api/prices');
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }

      const data = await response.json();
      if (data.success) {
        setRates(data.rates);
        setLastUpdated(Date.now());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exchange rates');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await fetchRates();
  };

  const getRateChange = (rate: number) => {
    // This would compare with previous rate in a real implementation
    // For now, just return neutral
    return 'neutral';
  };

  const getRateIcon = (change: string) => {
    switch (change) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      default:
        return <Minus className="h-4 w-4 text-muted" />;
    }
  };

  const convertAmount = (amount: number, from: string, to: string) => {
    const rate = rates.find(r => r.from_currency === from && r.to_currency === to);
    if (rate) {
      return (amount * rate.rate).toFixed(2);
    }
    return '0.00';
  };

  if (loading) {
    return (
      <Container>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
              <p className="mt-4 text-sm text-muted-foreground">Loading exchange rates...</p>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-7xl mx-auto py-12">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
              Exchange Rates
            </h1>
            <p className="mt-3 text-lg text-muted">
              Live cryptocurrency exchange rates
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold/20"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border border-red-500/50 bg-red-500/10 text-red-400">
            {error}
          </div>
        )}

        {/* Last Updated */}
        <div className="mb-6 text-sm text-muted">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </div>

        {/* Exchange Rates Grid */}
        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl">
          {rates.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Exchange Rates Available</h3>
              <p className="text-muted mb-6">
                Unable to load exchange rates at this time
              </p>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-gold/90"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rates.map((rate) => {
                const change = getRateChange(rate.rate);
                return (
                  <div key={`${rate.from_currency}-${rate.to_currency}`} className="p-6 rounded-xl border border-border/50 bg-card/30">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-gold/20">
                          <TrendingUp className="h-5 w-5 text-gold" />
                        </div>
                        <div>
                          <p className="text-sm text-muted">1 {rate.from_currency}</p>
                          <p className="text-lg font-bold text-white">{rate.rate.toFixed(6)}</p>
                        </div>
                      </div>
                      {getRateIcon(change)}
                    </div>

                    <div className="pt-4 border-t border-border/50">
                      <p className="text-xs text-muted mb-3">Quick Conversion</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted">10 {rate.from_currency}</span>
                          <span className="text-white font-medium">
                            {convertAmount(10, rate.from_currency, rate.to_currency)} {rate.to_currency}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted">100 {rate.from_currency}</span>
                          <span className="text-white font-medium">
                            {convertAmount(100, rate.from_currency, rate.to_currency)} {rate.to_currency}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted">1,000 {rate.from_currency}</span>
                          <span className="text-white font-medium">
                            {convertAmount(1000, rate.from_currency, rate.to_currency)} {rate.to_currency}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Currency Converter */}
        <div className="mt-8 luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-white mb-6">Currency Converter</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-muted mb-2">Amount</label>
              <input
                type="number"
                defaultValue="100"
                placeholder="Enter amount"
                className="w-full px-4 py-3 rounded-lg border border-border bg-background/50 text-white focus:border-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-muted mb-2">From</label>
              <select className="w-full px-4 py-3 rounded-lg border border-border bg-background/50 text-white focus:border-gold focus:outline-none">
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
                <option value="NXR">NXR</option>
                <option value="USDT">USDT</option>
                <option value="USDC">USDC</option>
                <option value="BNB">BNB</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted mb-2">To</label>
              <select className="w-full px-4 py-3 rounded-lg border border-border bg-background/50 text-white focus:border-gold focus:outline-none">
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
                <option value="NXR">NXR</option>
                <option value="USDT">USDT</option>
                <option value="USDC">USDC</option>
                <option value="BNB">BNB</option>
              </select>
            </div>

            <div className="flex items-end">
              <button className="w-full px-6 py-3 rounded-lg bg-gold text-black font-medium hover:bg-gold/90 transition-colors">
                Convert
              </button>
            </div>
          </div>
        </div>

        {/* Supported Currencies */}
        <div className="mt-8 luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-white mb-6">Supported Currencies</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {['NXR', 'BNB', 'USDT', 'USDC', 'BTC', 'ETH', 'USD'].map((currency) => (
              <div key={currency} className="p-4 rounded-xl border border-border/50 bg-card/30 text-center">
                <div className="text-2xl font-bold text-white mb-1">{currency}</div>
                <p className="text-xs text-muted">Supported</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}