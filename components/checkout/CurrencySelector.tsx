"use client";

import { Currency, type Money } from "@/shared/payments";
import { cn } from "@/lib/utils/cn";

interface CurrencySelectorProps {
  selectedCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  amount: Money;
  supportedCurrencies?: Currency[];
}

const ALL_CURRENCIES = [
  { code: Currency.NXR, name: "Nexar Network Token", icon: "₦", color: "from-purple-500 to-purple-700" },
  { code: Currency.USDT, name: "Tether USD", icon: "₮", color: "from-green-500 to-green-700" },
  { code: Currency.USDC, name: "USD Coin", icon: "$", color: "from-blue-500 to-blue-700" },
  { code: Currency.BNB, name: "Binance Coin", icon: "⬡", color: "from-yellow-500 to-yellow-700" },
  { code: Currency.ETH, name: "Ethereum", icon: "Ξ", color: "from-indigo-500 to-indigo-700" },
  { code: Currency.BTC, name: "Bitcoin", icon: "₿", color: "from-orange-500 to-orange-700" },
];

export function CurrencySelector({ selectedCurrency, onCurrencyChange, amount, supportedCurrencies }: CurrencySelectorProps) {
  const currencies = supportedCurrencies 
    ? ALL_CURRENCIES.filter(c => supportedCurrencies.includes(c.code))
    : ALL_CURRENCIES;
  return (
    <div>
      <h3 className="text-sm font-semibold text-white mb-3">Select Payment Currency</h3>
      <div className="grid grid-cols-2 gap-3">
        {currencies.map((currency) => (
          <button
            key={currency.code}
            onClick={() => onCurrencyChange(currency.code)}
            className={cn(
              "relative rounded-xl border p-4 transition-all duration-200",
              "hover:border-gold/50 hover:scale-[1.02]",
              selectedCurrency === currency.code
                ? "border-gold bg-gradient-to-br from-gold/10 to-gold/5 shadow-lg shadow-gold/10"
                : "border-border bg-background/50"
            )}
            aria-label={`Select ${currency.name}`}
            aria-pressed={selectedCurrency === currency.code}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-white font-bold",
                  currency.color
                )}
              >
                {currency.icon}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{currency.code}</p>
                <p className="text-xs text-muted-foreground">{currency.name}</p>
              </div>
            </div>
            
            {selectedCurrency === currency.code && (
              <div className="absolute right-3 top-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gold text-black">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
