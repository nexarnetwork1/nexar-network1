"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SITE, CONTRACTS } from "@/lib/constants/site";
import { CopyButton } from "./CopyButton";

const COIN_IDS = [
  "bitcoin",
  "ethereum",
  "binancecoin",
  "solana",
  "ripple",
  "dogecoin",
  "tron",
  "toncoin",
  "cardano",
  "avalanche-2",
  "chainlink",
  "sui",
  "polkadot",
  "litecoin",
  "tether",
  "usd-coin",
];

type CryptoData = {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
  market_cap: number;
  image: string;
};

const EXCHANGES = [
  {
    name: "PancakeSwap",
    status: "Coming Soon",
    icon: "🥞",
  },
  {
    name: "Uniswap",
    status: "Coming Soon",
    icon: "🦄",
  },
  {
    name: "Binance DEX",
    status: "Coming Soon",
    icon: "🔷",
  },
];

export default function MarketPage() {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCryptoData = async () => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COIN_IDS.join(
          ","
        )}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`
      );
      const data = await response.json();
      setCryptoData(data);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch crypto data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = () => {
      fetchCryptoData();
    };
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `$${price.toFixed(6)}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e12) return `$${(volume / 1e12).toFixed(2)}T`;
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    return `$${volume.toLocaleString()}`;
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toLocaleString()}`;
  };

  return (
    <main className="nav-offset min-h-screen">
      <Container className="py-16 lg:py-24">
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-xs font-medium tracking-[0.24em] text-gold uppercase">
            Market
          </p>
          <h1 className="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] font-semibold tracking-[-0.03em]">
            Trade {SITE.ticker}
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted">
            Buy and sell {SITE.ticker} on decentralized exchanges. Trading pairs and liquidity will be available after the presale concludes.
          </p>

          {/* Live Market Data */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-semibold">Live Market Data</h2>
              <div className="flex items-center gap-3">
                {lastUpdated && (
                  <p className="text-xs text-muted">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
                <button
                  onClick={fetchCryptoData}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:border-gold/30 hover:text-gold"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>

            <div className="luxury-border rounded-3xl bg-card/40 backdrop-blur-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-6 py-4 text-left text-xs font-medium tracking-wide text-muted uppercase">
                        Coin
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium tracking-wide text-muted uppercase">
                        Price
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium tracking-wide text-muted uppercase">
                        24h Change
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium tracking-wide text-muted uppercase">
                        24h Volume
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium tracking-wide text-muted uppercase">
                        Market Cap
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-muted">
                          Loading market data...
                        </td>
                      </tr>
                    ) : cryptoData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-muted">
                          Unable to load market data. Please try again later.
                        </td>
                      </tr>
                    ) : (
                      cryptoData.map((coin) => (
                        <tr
                          key={coin.id}
                          className="border-b border-border/50 transition-colors hover:bg-card/60"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Image
                                src={coin.image}
                                alt={coin.name}
                                width={32}
                                height={32}
                                className="h-8 w-8 rounded-full"
                              />
                              <div>
                                <p className="font-medium text-white">{coin.name}</p>
                                <p className="text-xs text-muted uppercase">
                                  {coin.symbol}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-white">
                            {formatPrice(coin.current_price)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span
                              className={`font-mono text-sm ${
                                coin.price_change_percentage_24h >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {coin.price_change_percentage_24h >= 0 ? "+" : ""}
                              {coin.price_change_percentage_24h?.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-muted">
                            {formatVolume(coin.total_volume)}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-muted">
                            {formatMarketCap(coin.market_cap)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Token Contract Card */}
          <div className="mt-12 luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl">
            <h2 className="font-heading text-xl font-semibold">Token Contract</h2>
            <p className="mt-2 text-sm text-muted">
              {SITE.ticker} is deployed on {SITE.blockchain}
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <p className="mb-2 text-xs tracking-wide text-muted uppercase">Token Address</p>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-background/80 px-4 py-3">
                  <code className="flex-1 font-mono text-sm text-gold-secondary">
                    {CONTRACTS.token}
                  </code>
                  <CopyButton text={CONTRACTS.token} label="Copy token address" />
                  <a
                    href={`https://bscscan.com/token/${CONTRACTS.token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-border p-2 text-muted transition-colors hover:border-gold/30 hover:text-gold"
                    aria-label="View on BscScan"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs tracking-wide text-muted uppercase">Presale Contract</p>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-background/80 px-4 py-3">
                  <code className="flex-1 font-mono text-sm text-gold-secondary">
                    {CONTRACTS.presale}
                  </code>
                  <CopyButton text={CONTRACTS.presale} label="Copy presale address" />
                  <a
                    href={`https://bscscan.com/address/${CONTRACTS.presale}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-border p-2 text-muted transition-colors hover:border-gold/30 hover:text-gold"
                    aria-label="View on BscScan"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Token Stats */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="luxury-border rounded-2xl bg-card/40 p-6 backdrop-blur-xl">
              <p className="text-xs tracking-wide text-muted uppercase">Ticker</p>
              <p className="mt-2 font-heading text-2xl font-semibold text-white">
                {SITE.ticker}
              </p>
            </div>
            <div className="luxury-border rounded-2xl bg-card/40 p-6 backdrop-blur-xl">
              <p className="text-xs tracking-wide text-muted uppercase">Network</p>
              <p className="mt-2 font-heading text-2xl font-semibold text-white">
                BEP20
              </p>
            </div>
            <div className="luxury-border rounded-2xl bg-card/40 p-6 backdrop-blur-xl">
              <p className="text-xs tracking-wide text-muted uppercase">Max Supply</p>
              <p className="mt-2 font-heading text-2xl font-semibold text-white">
                {SITE.maxSupply}
              </p>
            </div>
          </div>

          {/* Exchanges */}
          <div className="mt-12">
            <h2 className="font-heading text-xl font-semibold">Supported Exchanges</h2>
            <p className="mt-2 text-sm text-muted">
              {SITE.ticker} will be listed on the following exchanges after presale
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {EXCHANGES.map((exchange) => (
                <div
                  key={exchange.name}
                  className="luxury-border rounded-2xl bg-card/40 p-6 backdrop-blur-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{exchange.icon}</span>
                    <div>
                      <p className="font-heading text-lg font-semibold">{exchange.name}</p>
                      <p className="text-xs text-muted">{exchange.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="mt-12 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-6 py-4">
            <p className="text-sm text-amber-200/80">
              <strong className="text-amber-400">Important:</strong> Only trade {SITE.ticker} on verified exchanges using the official contract address above. Always verify the contract address before making any transactions.
            </p>
          </div>
        </div>
      </Container>
    </main>
  );
}
