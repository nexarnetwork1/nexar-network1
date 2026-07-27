// Fee calculation models and interfaces
// This file defines the fee structure without implementing business logic

import {
  Money,
  Currency,
  FeeType,
  PaymentMethodType,
  ValidationResult,
} from './types';

// Re-export fee configuration interfaces
export * from './fee-config';

// Re-export fee promotion interfaces
export * from './fee-promotions';

/**
 * Fee configuration
 */
export interface FeeConfiguration {
  id: string;
  merchantId: string;
  
  // Processing fees
  processingFees: ProcessingFeeConfig[];
  
  // Platform fees
  platformFeePercentage: number;
  platformFeeFixed?: Money;
  
  // Additional fees
  internationalFeePercentage?: number;
  currencyConversionFeePercentage?: number;
  
  // Fee caps
  minimumFee?: Money;
  maximumFee?: Money;
  
  // Fee discounts
  volumeDiscounts?: VolumeDiscount[];
  
  // Metadata
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Processing fee configuration per payment method
 */
export interface ProcessingFeeConfig {
  paymentMethodType: PaymentMethodType;
  cardNetwork?: string;
  percentage: number;
  fixedFee: Money;
  currencyConversionFee?: number;
}

/**
 * Volume discount configuration
 */
export interface VolumeDiscount {
  threshold: Money;
  discountPercentage: number;
  appliesTo: 'processing' | 'platform' | 'both';
}

/**
 * Fee calculation result
 */
export interface FeeCalculationResult {
  processingFee: Money;
  platformFee: Money;
  internationalFee?: Money;
  currencyConversionFee?: Money;
  totalFees: Money;
  netAmount: Money;
  breakdown: BasicFeeBreakdown[];
}

/**
 * Individual fee breakdown
 */
export interface BasicFeeBreakdown {
  type: FeeType;
  amount: Money;
  percentage?: number;
  description: string;
  paymentMethod?: PaymentMethodType;
}

/**
 * Fee calculation parameters
 */
export interface FeeCalculationParams {
  amount: Money;
  paymentMethodType: PaymentMethodType;
  cardNetwork?: string;
  currency?: Currency;
  isInternational?: boolean;
  requiresCurrencyConversion?: boolean;
  volume?: Money; // For volume discounts
}

/**
 * Fee service interface
 */
export interface IFeeService {
  // Calculate fees
  calculateFees(params: FeeCalculationParams, config: FeeConfiguration): FeeCalculationResult;
  
  // Get fee configuration
  getFeeConfiguration(merchantId: string): Promise<FeeConfiguration>;
  
  // Update fee configuration
  updateFeeConfiguration(merchantId: string, config: Partial<FeeConfiguration>): Promise<FeeConfiguration>;
  
  // Validate fee configuration
  validateFeeConfiguration(config: FeeConfiguration): Promise<ValidationResult>;
  
  // Calculate processing fee
  calculateProcessingFee(params: FeeCalculationParams, config: FeeConfiguration): Money;
  
  // Calculate platform fee
  calculatePlatformFee(params: FeeCalculationParams, config: FeeConfiguration): Money;
  
  // Calculate international fee
  calculateInternationalFee(params: FeeCalculationParams, config: FeeConfiguration): Money;
  
  // Calculate currency conversion fee
  calculateCurrencyConversionFee(params: FeeCalculationParams, config: FeeConfiguration): Money;
  
  // Apply volume discounts
  applyVolumeDiscount(params: FeeCalculationParams, config: FeeConfiguration): FeeCalculationResult;
  
  // Apply fee caps
  applyFeeCaps(fees: Money, config: FeeConfiguration): Money;
}

/**
 * Default fee configuration
 */
export const DEFAULT_FEE_CONFIGURATION: FeeConfiguration = {
  id: 'default',
  merchantId: 'default',
  
  processingFees: [
    {
      paymentMethodType: PaymentMethodType.CARD,
      percentage: 2.9, // 2.9% + $0.30 (like Stripe)
      fixedFee: {
        amount: 0.30,
        currency: Currency.USD,
      },
    },
    {
      paymentMethodType: PaymentMethodType.CRYPTO_WALLET,
      percentage: 1.0,
      fixedFee: {
        amount: 0.00,
        currency: Currency.USD,
      },
    },
    {
      paymentMethodType: PaymentMethodType.BANK_TRANSFER,
      percentage: 0.5,
      fixedFee: {
        amount: 5.00,
        currency: Currency.USD,
      },
    },
  ],
  
  platformFeePercentage: 0.5, // 0.5% platform fee
  platformFeeFixed: {
    amount: 0.00,
    currency: Currency.USD,
  },
  
  internationalFeePercentage: 1.0,
  currencyConversionFeePercentage: 0.5,
  
  minimumFee: {
    amount: 0.50,
    currency: Currency.USD,
  },
  
  volumeDiscounts: [
    {
      threshold: {
        amount: 100000,
        currency: Currency.USD,
      },
      discountPercentage: 0.1,
      appliesTo: 'platform',
    },
    {
      threshold: {
        amount: 1000000,
        currency: Currency.USD,
      },
      discountPercentage: 0.2,
      appliesTo: 'platform',
    },
  ],
  
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Calculate processing fee
 * Placeholder for future implementation
 */
export function calculateProcessingFee(
  params: FeeCalculationParams,
  config: FeeConfiguration
): Money {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Find applicable processing fee config
  // 2. Calculate percentage-based fee
  // 3. Add fixed fee
  // 4. Apply currency conversion fee if needed
  // 5. Return calculated fee
  
  return {
    amount: 0,
    currency: params.amount.currency,
  };
}

/**
 * Calculate platform fee
 * Placeholder for future implementation
 */
export function calculatePlatformFee(
  params: FeeCalculationParams,
  config: FeeConfiguration
): Money {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Calculate percentage-based fee
  // 2. Add fixed fee if applicable
  // 3. Apply volume discounts
  // 4. Return calculated fee
  
  return {
    amount: 0,
    currency: params.amount.currency,
  };
}

/**
 * Calculate international fee
 * Placeholder for future implementation
 */
export function calculateInternationalFee(
  params: FeeCalculationParams,
  config: FeeConfiguration
): Money {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Check if transaction is international
  // 2. Calculate international fee percentage
  // 3. Return calculated fee
  
  return {
    amount: 0,
    currency: params.amount.currency,
  };
}

/**
 * Calculate currency conversion fee
 * Placeholder for future implementation
 */
export function calculateCurrencyConversionFee(
  params: FeeCalculationParams,
  config: FeeConfiguration
): Money {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Check if currency conversion is required
  // 2. Calculate conversion fee percentage
  // 3. Return calculated fee
  
  return {
    amount: 0,
    currency: params.amount.currency,
  };
}

/**
 * Apply volume discounts
 * Placeholder for future implementation
 */
export function applyVolumeDiscount(
  params: FeeCalculationParams,
  config: FeeConfiguration
): FeeCalculationResult {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Check if volume threshold is met
  // 2. Find applicable discount
  // 3. Apply discount to relevant fees
  // 4. Return updated fee calculation
  
  return {
    processingFee: {
      amount: 0,
      currency: params.amount.currency,
    },
    platformFee: {
      amount: 0,
      currency: params.amount.currency,
    },
    totalFees: {
      amount: 0,
      currency: params.amount.currency,
    },
    netAmount: {
      amount: 0,
      currency: params.amount.currency,
    },
    breakdown: [],
  };
}

/**
 * Apply fee caps
 * Placeholder for future implementation
 */
export function applyFeeCaps(
  fee: Money,
  config: FeeConfiguration
): Money {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Check if fee exceeds maximum
  // 2. Check if fee is below minimum
  // 3. Apply cap or minimum as needed
  // 4. Return adjusted fee
  
  return fee;
}

/**
 * Calculate total fees
 * Placeholder for future implementation
 */
export function calculateTotalFees(
  params: FeeCalculationParams,
  config: FeeConfiguration
): FeeCalculationResult {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Calculate processing fee
  // 2. Calculate platform fee
  // 3. Calculate international fee if applicable
  // 4. Calculate currency conversion fee if applicable
  // 5. Apply volume discounts
  // 6. Apply fee caps
  // 7. Return total fee calculation
  
  return {
    processingFee: {
      amount: 0,
      currency: params.amount.currency,
    },
    platformFee: {
      amount: 0,
      currency: params.amount.currency,
    },
    totalFees: {
      amount: 0,
      currency: params.amount.currency,
    },
    netAmount: {
      amount: 0,
      currency: params.amount.currency,
    },
    breakdown: [],
  };
}

/**
 * Calculate net amount after fees
 */
export function calculateNetAmount(
  grossAmount: Money,
  fees: Money
): Money {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Subtract fees from gross amount
  // 2. Ensure result is not negative
  // 3. Return net amount
  
  return {
    amount: Math.max(0, grossAmount.amount - fees.amount),
    currency: grossAmount.currency,
  };
}

/**
 * Get fee breakdown for display
 */
export function getFeeBreakdown(
  calculation: FeeCalculationResult
): BasicFeeBreakdown[] {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Format fee breakdown
  // 2. Include descriptive text
  // 3. Return breakdown array
  
  return calculation.breakdown;
}

/**
 * Validate fee parameters
 */
export function validateFeeParams(
  params: FeeCalculationParams
): ValidationResult {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Validate amount is positive
  // 2. Validate currency is supported
  // 3. Validate payment method is valid
  // 4. Return validation result
  
  return {
    valid: true,
    errors: [],
  };
}

/**
 * Fee structure for different payment methods
 */
export const PAYMENT_METHOD_FEE_STRUCTURES: Record<PaymentMethodType, {
  hasPercentageFee: boolean;
  hasFixedFee: boolean;
  typicalPercentage: number;
  typicalFixedFee: Money;
}> = {
  [PaymentMethodType.CARD]: {
    hasPercentageFee: true,
    hasFixedFee: true,
    typicalPercentage: 2.9,
    typicalFixedFee: {
      amount: 0.30,
      currency: Currency.USD,
    },
  },
  [PaymentMethodType.BANK_ACCOUNT]: {
    hasPercentageFee: true,
    hasFixedFee: true,
    typicalPercentage: 0.8,
    typicalFixedFee: {
      amount: 5.00,
      currency: Currency.USD,
    },
  },
  [PaymentMethodType.CRYPTO_WALLET]: {
    hasPercentageFee: true,
    hasFixedFee: false,
    typicalPercentage: 1.0,
    typicalFixedFee: {
      amount: 0.00,
      currency: Currency.USD,
    },
  },
  [PaymentMethodType.APPLE_PAY]: {
    hasPercentageFee: true,
    hasFixedFee: false,
    typicalPercentage: 2.9,
    typicalFixedFee: {
      amount: 0.00,
      currency: Currency.USD,
    },
  },
  [PaymentMethodType.GOOGLE_PAY]: {
    hasPercentageFee: true,
    hasFixedFee: false,
    typicalPercentage: 2.9,
    typicalFixedFee: {
      amount: 0.00,
      currency: Currency.USD,
    },
  },
  [PaymentMethodType.BANK_TRANSFER]: {
    hasPercentageFee: true,
    hasFixedFee: true,
    typicalPercentage: 0.5,
    typicalFixedFee: {
      amount: 5.00,
      currency: Currency.USD,
    },
  },
};
