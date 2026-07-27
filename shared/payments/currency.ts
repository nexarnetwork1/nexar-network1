// Currency abstraction and conversion
// This file defines the currency structure without implementing business logic

import {
  Money,
  Currency,
  CurrencyConversion,
  ValidationResult,
} from './types';

/**
 * Currency configuration
 */
export interface CurrencyConfig {
  code: Currency;
  name: string;
  symbol: string;
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
  isActive: boolean;
  supportedForPayments: boolean;
  supportedForSettlements: boolean;
}

/**
 * Exchange rate
 */
export interface ExchangeRate {
  from: Currency;
  to: Currency;
  rate: number;
  timestamp: Date;
  source: string;
}

/**
 * Currency conversion parameters
 */
export interface CurrencyConversionParams {
  amount: Money;
  toCurrency: Currency;
  rate?: number;
  includeFee?: boolean;
  feePercentage?: number;
}

/**
 * Currency service interface
 */
export interface ICurrencyService {
  // Convert currency
  convertCurrency(params: CurrencyConversionParams): Promise<CurrencyConversion>;
  
  // Get exchange rate
  getExchangeRate(from: Currency, to: Currency): Promise<ExchangeRate>;
  
  // Format currency
  formatCurrency(amount: Money, locale?: string): string;
  
  // Parse currency string
  parseCurrencyString(amountString: string, currency: Currency): Money;
  
  // Validate currency
  validateCurrency(currency: Currency): boolean;
  
  // Get supported currencies
  getSupportedCurrencies(): Currency[];
  
  // Get currency configuration
  getCurrencyConfig(currency: Currency): CurrencyConfig;
  
  // Calculate conversion with fee
  calculateConversionWithFee(
    amount: Money,
    toCurrency: Currency,
    feePercentage: number
  ): Promise<CurrencyConversion>;
  
  // Round currency amount
  roundCurrencyAmount(amount: Money): Money;
  
  // Check if currency is supported
  isCurrencySupported(currency: Currency): boolean;
}

/**
 * Currency configurations
 */
export const CURRENCY_CONFIGURATIONS: Record<Currency, CurrencyConfig> = {
  [Currency.USD]: {
    code: Currency.USD,
    name: 'US Dollar',
    symbol: '$',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    isActive: true,
    supportedForPayments: true,
    supportedForSettlements: true,
  },
  [Currency.EUR]: {
    code: Currency.EUR,
    name: 'Euro',
    symbol: '€',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
    isActive: true,
    supportedForPayments: true,
    supportedForSettlements: true,
  },
  [Currency.GBP]: {
    code: Currency.GBP,
    name: 'British Pound',
    symbol: '£',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    isActive: true,
    supportedForPayments: true,
    supportedForSettlements: true,
  },
  [Currency.JPY]: {
    code: Currency.JPY,
    name: 'Japanese Yen',
    symbol: '¥',
    decimalPlaces: 0,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    isActive: true,
    supportedForPayments: true,
    supportedForSettlements: true,
  },
  [Currency.BNB]: {
    code: Currency.BNB,
    name: 'Binance Coin',
    symbol: 'BNB',
    decimalPlaces: 18,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    isActive: true,
    supportedForPayments: true,
    supportedForSettlements: true,
  },
  [Currency.ETH]: {
    code: Currency.ETH,
    name: 'Ethereum',
    symbol: 'ETH',
    decimalPlaces: 18,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    isActive: true,
    supportedForPayments: true,
    supportedForSettlements: true,
  },
  [Currency.BTC]: {
    code: Currency.BTC,
    name: 'Bitcoin',
    symbol: 'BTC',
    decimalPlaces: 8,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    isActive: true,
    supportedForPayments: true,
    supportedForSettlements: true,
  },
  [Currency.USDT]: {
    code: Currency.USDT,
    name: 'Tether',
    symbol: 'USDT',
    decimalPlaces: 6,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    isActive: true,
    supportedForPayments: true,
    supportedForSettlements: true,
  },
  [Currency.USDC]: {
    code: Currency.USDC,
    name: 'USD Coin',
    symbol: 'USDC',
    decimalPlaces: 6,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    isActive: true,
    supportedForPayments: true,
    supportedForSettlements: true,
  },
  [Currency.NXR]: {
    code: Currency.NXR,
    name: 'Nexar Network Token',
    symbol: 'NXR',
    decimalPlaces: 18,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    isActive: true,
    supportedForPayments: true,
    supportedForSettlements: true,
  },
};

/**
 * Default exchange rates (placeholder)
 */
export const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  'USD-EUR': 0.92,
  'USD-GBP': 0.79,
  'USD-JPY': 149.50,
  'USD-BNB': 0.0025,
  'USD-ETH': 0.0006,
  'USD-BTC': 0.000015,
  'USD-USDT': 1.0,
  'USD-USDC': 1.0,
  'USD-NXR': 0.01,
};

/**
 * Format currency amount
 * Placeholder for future implementation
 */
export function formatCurrency(amount: Money, locale: string = 'en-US'): string {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Get currency configuration
  // 2. Format amount with proper decimal places
  // 3. Add currency symbol
  // 4. Apply locale-specific formatting
  
  const config = CURRENCY_CONFIGURATIONS[amount.currency];
  const formattedAmount = amount.amount.toFixed(config.decimalPlaces);
  return `${config.symbol}${formattedAmount}`;
}

/**
 * Parse currency string
 * Placeholder for future implementation
 */
export function parseCurrencyString(
  amountString: string,
  currency: Currency
): Money {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Remove currency symbol
  // 2. Parse numeric value
  // 3. Return Money object
  
  return {
    amount: 0,
    currency,
  };
}

/**
 * Validate currency
 */
export function validateCurrency(currency: Currency): boolean {
  return currency in CURRENCY_CONFIGURATIONS;
}

/**
 * Get supported currencies
 */
export function getSupportedCurrencies(): Currency[] {
  return Object.values(Currency).filter(currency => 
    CURRENCY_CONFIGURATIONS[currency].isActive
  );
}

/**
 * Get currency configuration
 */
export function getCurrencyConfig(currency: Currency): CurrencyConfig {
  return CURRENCY_CONFIGURATIONS[currency];
}

/**
 * Convert currency
 * Placeholder for future implementation
 */
export function convertCurrency(
  params: CurrencyConversionParams
): CurrencyConversion {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Get exchange rate
  // 2. Calculate converted amount
  // 3. Apply conversion fee if requested
  // 4. Return conversion result
  
  const rate = params.rate || DEFAULT_EXCHANGE_RATES[`${params.amount.currency}-${params.toCurrency}`] || 1.0;
  const convertedAmount = params.amount.amount * rate;
  
  return {
    from: params.amount,
    to: {
      amount: convertedAmount,
      currency: params.toCurrency,
    },
    rate,
    fee: params.includeFee ? {
      amount: convertedAmount * (params.feePercentage || 0) / 100,
      currency: params.toCurrency,
    } : undefined,
    timestamp: new Date(),
  };
}

/**
 * Get exchange rate
 * Placeholder for future implementation
 */
export function getExchangeRate(from: Currency, to: Currency): ExchangeRate {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Query exchange rate API
  // 2. Cache rates
  // 3. Return rate with timestamp
  
  const rateKey = `${from}-${to}`;
  const rate = DEFAULT_EXCHANGE_RATES[rateKey] || 1.0;
  
  return {
    from,
    to,
    rate,
    timestamp: new Date(),
    source: 'placeholder',
  };
}

/**
 * Calculate conversion with fee
 * Placeholder for future implementation
 */
export function calculateConversionWithFee(
  amount: Money,
  toCurrency: Currency,
  feePercentage: number
): CurrencyConversion {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Get exchange rate
  // 2. Calculate converted amount
  // 3. Calculate fee amount
  // 4. Subtract fee from converted amount
  // 5. Return conversion result
  
  const conversion = convertCurrency({
    amount,
    toCurrency,
    includeFee: true,
    feePercentage,
  });
  
  return conversion;
}

/**
 * Round currency amount
 */
export function roundCurrencyAmount(amount: Money): Money {
  const config = CURRENCY_CONFIGURATIONS[amount.currency];
  const roundedAmount = Number(amount.amount.toFixed(config.decimalPlaces));
  
  return {
    amount: roundedAmount,
    currency: amount.currency,
  };
}

/**
 * Check if currency is supported
 */
export function isCurrencySupported(currency: Currency): boolean {
  const config = CURRENCY_CONFIGURATIONS[currency];
  return config && config.isActive;
}

/**
 * Check if currency is crypto
 */
export function isCryptoCurrency(currency: Currency): boolean {
  const cryptoCurrencies = [Currency.BNB, Currency.ETH, Currency.BTC, Currency.USDT, Currency.USDC, Currency.NXR];
  return cryptoCurrencies.includes(currency);
}

/**
 * Check if currency is fiat
 */
export function isFiatCurrency(currency: Currency): boolean {
  return !isCryptoCurrency(currency);
}

/**
 * Get currency type
 */
export function getCurrencyType(currency: Currency): 'fiat' | 'crypto' {
  return isCryptoCurrency(currency) ? 'crypto' : 'fiat';
}

/**
 * Currency validation result
 */
export interface CurrencyValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate currency amount
 */
export function validateCurrencyAmount(amount: Money): CurrencyValidationResult {
  const errors: string[] = [];
  
  if (amount.amount < 0) {
    errors.push('Amount cannot be negative');
  }
  
  if (!validateCurrency(amount.currency)) {
    errors.push('Invalid currency code');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Currency conversion cache
 */
export interface CurrencyConversionCache {
  conversions: Map<string, CurrencyConversion>;
  get(key: string): CurrencyConversion | undefined;
  set(key: string, conversion: CurrencyConversion): void;
  clear(): void;
}

/**
 * Create currency conversion cache
 */
export function createCurrencyConversionCache(): CurrencyConversionCache {
  const conversions = new Map<string, CurrencyConversion>();
  
  return {
    conversions,
    get(key: string): CurrencyConversion | undefined {
      return conversions.get(key);
    },
    set(key: string, conversion: CurrencyConversion): void {
      conversions.set(key, conversion);
    },
    clear(): void {
      conversions.clear();
    },
  };
}

/**
 * Calculate conversion cache key
 */
export function getConversionCacheKey(
  from: Currency,
  to: Currency,
  amount: number
): string {
  return `${from}-${to}-${amount}`;
}

/**
 * Multi-currency conversion
 */
export interface MultiCurrencyConversion {
  from: Money;
  conversions: CurrencyConversion[];
  totalFees: Money;
}

/**
 * Convert to multiple currencies
 */
export function convertToMultipleCurrencies(
  amount: Money,
  targetCurrencies: Currency[]
): MultiCurrencyConversion {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Convert to each target currency
  // 2. Calculate total fees
  // 3. Return multi-currency result
  
  const conversions = targetCurrencies.map(currency =>
    convertCurrency({ amount, toCurrency: currency })
  );
  
  return {
    from: amount,
    conversions,
    totalFees: {
      amount: 0,
      currency: amount.currency,
    },
  };
}

/**
 * Currency comparison result
 */
export interface CurrencyComparison {
  amount1: Money;
  amount2: Money;
  comparison: 'greater' | 'less' | 'equal';
  difference: Money;
}

/**
 * Compare currency amounts
 */
export function compareCurrencyAmounts(
  amount1: Money,
  amount2: Money
): CurrencyComparison {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Convert to same currency if needed
  // 2. Compare amounts
  // 3. Calculate difference
  // 4. Return comparison result
  
  let comparison: 'greater' | 'less' | 'equal';
  if (amount1.amount > amount2.amount) {
    comparison = 'greater';
  } else if (amount1.amount < amount2.amount) {
    comparison = 'less';
  } else {
    comparison = 'equal';
  }
  
  return {
    amount1,
    amount2,
    comparison,
    difference: {
      amount: Math.abs(amount1.amount - amount2.amount),
      currency: amount1.currency,
    },
  };
}
