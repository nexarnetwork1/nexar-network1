"use client";

import React, { useState, useEffect } from 'react';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { priceService, SUPPORTED_CURRENCIES, CurrencyInfo } from '@/lib/services/priceService';

interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  disabled?: boolean;
  showFiatEquivalent?: boolean;
  amount?: number;
  className?: string;
}

export function CurrencySelector({
  selectedCurrency,
  onCurrencyChange,
  disabled = false,
  showFiatEquivalent = false,
  amount = 0,
  className = '',
}: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const prices = priceService.getAllPrices();
  const lastUpdate = priceService.getLastUpdate();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await priceService.refresh();
    setIsRefreshing(false);
  };

  const selectedCurrencyInfo = SUPPORTED_CURRENCIES[selectedCurrency] || null;
  const selectedPrice = priceService.getPrice(selectedCurrency);
  const fiatEquivalent = showFiatEquivalent && amount > 0 
    ? priceService.getFiatEquivalent(amount, selectedCurrency, 'USD')
    : null;

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50
          bg-card/40 hover:border-gold/50 transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {selectedCurrencyInfo ? (
          <>
            <div className="relative w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center overflow-hidden">
              {selectedCurrencyInfo.icon ? (
                <img 
                  src={selectedCurrencyInfo.icon} 
                  alt={selectedCurrencyInfo.name}
                  className="w-6 h-6 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.textContent = selectedCurrencyInfo.symbol[0];
                  }}
                />
              ) : (
                <span className="text-gold font-bold text-sm">
                  {selectedCurrencyInfo.symbol[0]}
                </span>
              )}
            </div>
            
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{selectedCurrencyInfo.symbol}</span>
                <span className="text-xs text-muted-foreground">{selectedCurrencyInfo.name}</span>
              </div>
              {selectedPrice && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gold">
                    {priceService.formatPrice(selectedPrice)}
                  </span>
                  {priceService.getPriceChange(selectedCurrency) !== null && (
                    <span className={`text-xs ${
                      (priceService.getPriceChange(selectedCurrency) || 0) >= 0 
                        ? 'text-green-400' 
                        : 'text-red-400'
                    }`}>
                      {(priceService.getPriceChange(selectedCurrency) || 0) >= 0 ? '+' : ''}
                      {priceService.getPriceChange(selectedCurrency)?.toFixed(2)}%
                    </span>
                  )}
                </div>
              )}
            </div>

            {fiatEquivalent && (
              <div className="text-right">
                <div className="text-xs text-muted-foreground">≈</div>
                <div className="text-sm text-gold font-medium">
                  ${fiatEquivalent.toFixed(2)}
                </div>
              </div>
            )}

            <ChevronDown className={`h-4 w-4 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        ) : (
          <span className="text-muted-foreground">Select currency</span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-2 luxury-border rounded-xl bg-card/95 backdrop-blur-xl shadow-2xl max-h-96 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">Select Currency</h3>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 text-xs text-muted hover:text-gold transition-colors"
                >
                  <Loader2 className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              {lastUpdate && (
                <p className="text-xs text-muted-foreground mt-2">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </p>
              )}
            </div>

            {/* Currency List */}
            <div className="overflow-y-auto max-h-72">
              {Object.values(SUPPORTED_CURRENCIES).map((currency) => {
                const price = priceService.getPrice(currency.symbol);
                const priceChange = priceService.getPriceChange(currency.symbol);
                const isSelected = currency.symbol === selectedCurrency;

                return (
                  <button
                    key={currency.symbol}
                    type="button"
                    onClick={() => {
                      onCurrencyChange(currency.symbol);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 hover:bg-gold/10 transition-colors
                      ${isSelected ? 'bg-gold/20' : ''}
                    `}
                  >
                    <div className="relative w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center overflow-hidden shrink-0">
                      {currency.icon ? (
                        <img 
                          src={currency.icon} 
                          alt={currency.name}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.textContent = currency.symbol[0];
                          }}
                        />
                      ) : (
                        <span className="text-gold font-bold text-sm">
                          {currency.symbol[0]}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{currency.symbol}</span>
                        <span className="text-xs text-muted-foreground">{currency.name}</span>
                      </div>
                      {price && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gold">
                            {priceService.formatPrice(price)}
                          </span>
                          {priceChange !== null && (
                            <span className={`text-xs ${
                              priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="h-5 w-5 text-gold shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Compact version for use in forms
export function CompactCurrencySelector({
  selectedCurrency,
  onCurrencyChange,
  disabled = false,
  className = '',
}: {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const selectedCurrencyInfo = SUPPORTED_CURRENCIES[selectedCurrency] || null;
  const selectedPrice = priceService.getPrice(selectedCurrency);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {selectedCurrencyInfo && (
        <>
          <div className="relative w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center overflow-hidden shrink-0">
            {selectedCurrencyInfo.icon ? (
              <img 
                src={selectedCurrencyInfo.icon} 
                alt={selectedCurrencyInfo.name}
                className="w-4 h-4 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.textContent = selectedCurrencyInfo.symbol[0];
                }}
              />
            ) : (
              <span className="text-gold font-bold text-xs">
                {selectedCurrencyInfo.symbol[0]}
              </span>
            )}
          </div>
          
          <span className="text-white font-medium text-sm">{selectedCurrencyInfo.symbol}</span>
          
          {selectedPrice && (
            <span className="text-xs text-gold">
              {priceService.formatPrice(selectedPrice)}
            </span>
          )}
        </>
      )}
    </div>
  );
}