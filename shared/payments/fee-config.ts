// Configurable Fee Engine
// This file defines the configuration-driven fee system without hardcoded business logic

import {
  Money,
  Currency,
  PaymentMethodType,
  FeeType,
} from './types';

/**
 * Fee Configuration Schema
 * This represents the complete fee configuration for the platform
 */
export interface FeeConfigurationSchema {
  id: string;
  name: string;
  version: string;
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
  
  // Currency-specific fees
  currencyFees: CurrencyFeeConfig[];
  
  // Payment method fees
  paymentMethodFees: PaymentMethodFeeConfig[];
  
  // Enterprise custom fees
  enterpriseFees: EnterpriseFeeConfig[];
  
  // Volume discounts
  volumeDiscounts: VolumeDiscountConfig[];
  
  // Platform-wide fees
  platformFees: PlatformFeeConfig;
  
  // Fee caps and limits
  feeLimits: FeeLimitsConfig;
  
  // Metadata
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Currency-specific fee configuration
 */
export interface CurrencyFeeConfig {
  currency: Currency;
  feePercentage: number;
  fixedFee?: Money;
  isActive: boolean;
  priority: number; // Higher priority overrides lower priority
  description?: string;
}

/**
 * Payment method fee configuration
 */
export interface PaymentMethodFeeConfig {
  paymentMethodType: PaymentMethodType;
  cardNetwork?: string;
  feePercentage: number;
  fixedFee: Money;
  isActive: boolean;
  priority: number;
  description?: string;
}

/**
 * Enterprise custom fee configuration
 */
export interface EnterpriseFeeConfig {
  enterpriseId: string;
  enterpriseName: string;
  customFeePercentage: number;
  customFixedFee?: Money;
  currencyOverrides?: Record<Currency, number>;
  paymentMethodOverrides?: Record<PaymentMethodType, number>;
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
  description?: string;
}

/**
 * Volume discount configuration
 */
export interface VolumeDiscountConfig {
  id: string;
  name: string;
  threshold: Money;
  discountPercentage: number;
  appliesTo: 'processing' | 'platform' | 'both';
  currency?: Currency; // If specified, applies only to this currency
  paymentMethod?: PaymentMethodType; // If specified, applies only to this method
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
  description?: string;
}

/**
 * Platform fee configuration
 */
export interface PlatformFeeConfig {
  basePercentage: number;
  baseFixedFee?: Money;
  currencySpecific: Record<Currency, number>;
  minimumFee?: Money;
  maximumFee?: Money;
}

/**
 * Fee limits configuration
 */
export interface FeeLimitsConfig {
  minimumFee: Money;
  maximumFee?: Money;
  maximumPercentage?: number;
  dailyVolumeLimit?: Money;
  monthlyVolumeLimit?: Money;
}

/**
 * Fee promotion/override configuration
 */
export interface FeePromotionConfig {
  id: string;
  name: string;
  type: 'percentage_discount' | 'fixed_amount' | 'zero_fee' | 'custom_fee';
  value: number; // Percentage or fixed amount
  currency?: Currency;
  paymentMethods?: PaymentMethodType[];
  currencies?: Currency[];
  enterprises?: string[]; // Enterprise IDs
  minimumVolume?: Money;
  maximumVolume?: Money;
  effectiveFrom: Date;
  effectiveTo: Date;
  isActive: boolean;
  maxUses?: number;
  currentUses?: number;
  priority: number; // Higher priority takes precedence
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fee calculation context
 */
export interface FeeCalculationContext {
  merchantId: string;
  enterpriseId?: string;
  amount: Money;
  paymentMethodType: PaymentMethodType;
  cardNetwork?: string;
  currency: Currency;
  isInternational?: boolean;
  requiresCurrencyConversion?: boolean;
  volume?: Money; // Current merchant volume
  timestamp?: Date;
}

/**
 * Fee calculation result with breakdown
 */
export interface DetailedFeeCalculationResult {
  originalFee: Money;
  appliedFee: Money;
  totalDiscount: Money;
  feeBreakdown: DetailedFeeBreakdownItem[];
  appliedPromotions: AppliedPromotion[];
  currencyFee: CurrencyFeeConfig | null;
  paymentMethodFee: PaymentMethodFeeConfig | null;
  enterpriseFee: EnterpriseFeeConfig | null;
  volumeDiscount: VolumeDiscountConfig | null;
  finalPercentage: number;
  finalFixedFee: Money;
}

/**
 * Fee breakdown item
 */
export interface DetailedFeeBreakdownItem {
  type: FeeType;
  source: 'currency' | 'payment_method' | 'enterprise' | 'platform' | 'volume_discount' | 'promotion';
  percentage: number;
  fixedAmount: Money;
  calculatedAmount: Money;
  description: string;
}

/**
 * Applied promotion
 */
export interface AppliedPromotion {
  promotionId: string;
  promotionName: string;
  type: 'percentage_discount' | 'fixed_amount' | 'zero_fee' | 'custom_fee';
  discountAmount: Money;
  priority: number;
}

/**
 * Admin fee configuration service interface
 */
export interface IFeeConfigurationService {
  // Fee configuration management
  createFeeConfiguration(config: Partial<FeeConfigurationSchema>): Promise<FeeConfigurationSchema>;
  getFeeConfiguration(configId: string): Promise<FeeConfigurationSchema>;
  getActiveFeeConfiguration(date?: Date): Promise<FeeConfigurationSchema>;
  updateFeeConfiguration(configId: string, config: Partial<FeeConfigurationSchema>): Promise<FeeConfigurationSchema>;
  deactivateFeeConfiguration(configId: string): Promise<void>;
  
  // Currency fee management
  addCurrencyFee(configId: string, fee: CurrencyFeeConfig): Promise<CurrencyFeeConfig>;
  updateCurrencyFee(configId: string, currency: Currency, fee: Partial<CurrencyFeeConfig>): Promise<CurrencyFeeConfig>;
  removeCurrencyFee(configId: string, currency: Currency): Promise<void>;
  
  // Payment method fee management
  addPaymentMethodFee(configId: string, fee: PaymentMethodFeeConfig): Promise<PaymentMethodFeeConfig>;
  updatePaymentMethodFee(configId: string, paymentMethodType: PaymentMethodType, fee: Partial<PaymentMethodFeeConfig>): Promise<PaymentMethodFeeConfig>;
  removePaymentMethodFee(configId: string, paymentMethodType: PaymentMethodType): Promise<void>;
  
  // Enterprise fee management
  addEnterpriseFee(fee: EnterpriseFeeConfig): Promise<EnterpriseFeeConfig>;
  updateEnterpriseFee(enterpriseId: string, fee: Partial<EnterpriseFeeConfig>): Promise<EnterpriseFeeConfig>;
  removeEnterpriseFee(enterpriseId: string): Promise<void>;
  getEnterpriseFee(enterpriseId: string): Promise<EnterpriseFeeConfig | null>;
  
  // Volume discount management
  addVolumeDiscount(configId: string, discount: VolumeDiscountConfig): Promise<VolumeDiscountConfig>;
  updateVolumeDiscount(configId: string, discountId: string, discount: Partial<VolumeDiscountConfig>): Promise<VolumeDiscountConfig>;
  removeVolumeDiscount(configId: string, discountId: string): Promise<void>;
  
  // Promotion management
  createPromotion(promotion: FeePromotionConfig): Promise<FeePromotionConfig>;
  getPromotion(promotionId: string): Promise<FeePromotionConfig>;
  updatePromotion(promotionId: string, promotion: Partial<FeePromotionConfig>): Promise<FeePromotionConfig>;
  deactivatePromotion(promotionId: string): Promise<void>;
  getActivePromotions(context: FeeCalculationContext): Promise<FeePromotionConfig[]>;
  
  // Fee calculation
  calculateFees(context: FeeCalculationContext): Promise<DetailedFeeCalculationResult>;
  
  // Validation
  validateFeeConfiguration(config: FeeConfigurationSchema): Promise<FeeConfigValidationResult>;
}

/**
 * Fee configuration validation result
 */
export interface FeeConfigValidationResult {
  valid: boolean;
  errors: FeeConfigValidationError[];
}

/**
 * Fee configuration validation error
 */
export interface FeeConfigValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Default fee configuration with required fee structures
 */
export const DEFAULT_FEE_CONFIGURATION: FeeConfigurationSchema = {
  id: 'default-config',
  name: 'Default Fee Configuration',
  version: '1.0.0',
  isActive: true,
  effectiveFrom: new Date('2024-01-01'),
  
  currencyFees: [
    {
      currency: Currency.NXR,
      feePercentage: 0.0, // NXR Launch Fee: 0%
      isActive: true,
      priority: 10,
      description: 'NXR Launch Promotion - Zero fee',
    },
    {
      currency: Currency.NXR,
      feePercentage: 0.10, // NXR Standard Fee: 0.10%
      isActive: false, // Currently inactive, will be active after launch
      priority: 5,
      description: 'NXR Standard Fee',
    },
    {
      currency: Currency.USDT,
      feePercentage: 0.25, // USDT Fee: 0.25%
      isActive: true,
      priority: 10,
      description: 'USDT Standard Fee',
    },
    {
      currency: Currency.USDC,
      feePercentage: 0.25, // USDC Fee: 0.25%
      isActive: true,
      priority: 10,
      description: 'USDC Standard Fee',
    },
    {
      currency: Currency.BNB,
      feePercentage: 0.25, // BNB Fee: 0.25%
      isActive: true,
      priority: 10,
      description: 'BNB Standard Fee',
    },
    {
      currency: Currency.ETH,
      feePercentage: 0.25, // ETH Fee: 0.25%
      isActive: true,
      priority: 10,
      description: 'ETH Standard Fee',
    },
    {
      currency: Currency.BTC,
      feePercentage: 0.25, // BTC Fee: 0.25%
      isActive: true,
      priority: 10,
      description: 'BTC Standard Fee',
    },
    {
      currency: Currency.USD,
      feePercentage: 2.9, // Standard card processing fee
      fixedFee: {
        amount: 0.30,
        currency: Currency.USD,
      },
      isActive: true,
      priority: 10,
      description: 'USD Standard Fee',
    },
    {
      currency: Currency.EUR,
      feePercentage: 2.9,
      fixedFee: {
        amount: 0.28,
        currency: Currency.EUR,
      },
      isActive: true,
      priority: 10,
      description: 'EUR Standard Fee',
    },
    {
      currency: Currency.GBP,
      feePercentage: 2.5,
      fixedFee: {
        amount: 0.20,
        currency: Currency.GBP,
      },
      isActive: true,
      priority: 10,
      description: 'GBP Standard Fee',
    },
    {
      currency: Currency.JPY,
      feePercentage: 3.6,
      fixedFee: {
        amount: 0,
        currency: Currency.JPY,
      },
      isActive: true,
      priority: 10,
      description: 'JPY Standard Fee',
    },
  ],
  
  paymentMethodFees: [
    {
      paymentMethodType: PaymentMethodType.CARD,
      feePercentage: 2.9,
      fixedFee: {
        amount: 0.30,
        currency: Currency.USD,
      },
      isActive: true,
      priority: 10,
      description: 'Card Payment Standard Fee',
    },
    {
      paymentMethodType: PaymentMethodType.CRYPTO_WALLET,
      feePercentage: 0.25,
      fixedFee: {
        amount: 0.00,
        currency: Currency.USD,
      },
      isActive: true,
      priority: 10,
      description: 'Crypto Wallet Standard Fee',
    },
    {
      paymentMethodType: PaymentMethodType.BANK_TRANSFER,
      feePercentage: 0.5,
      fixedFee: {
        amount: 5.00,
        currency: Currency.USD,
      },
      isActive: true,
      priority: 10,
      description: 'Bank Transfer Standard Fee',
    },
  ],
  
  enterpriseFees: [], // Enterprise custom fees to be configured by Admin
  
  volumeDiscounts: [
    {
      id: 'volume-discount-1',
      name: 'High Volume Discount',
      threshold: {
        amount: 100000,
        currency: Currency.USD,
      },
      discountPercentage: 0.1,
      appliesTo: 'platform',
      isActive: true,
      effectiveFrom: new Date('2024-01-01'),
      description: '10% discount on platform fees for merchants with $100k+ monthly volume',
    },
    {
      id: 'volume-discount-2',
      name: 'Enterprise Volume Discount',
      threshold: {
        amount: 1000000,
        currency: Currency.USD,
      },
      discountPercentage: 0.2,
      appliesTo: 'platform',
      isActive: true,
      effectiveFrom: new Date('2024-01-01'),
      description: '20% discount on platform fees for merchants with $1M+ monthly volume',
    },
  ],
  
  platformFees: {
    basePercentage: 0.5,
    baseFixedFee: {
      amount: 0.00,
      currency: Currency.USD,
    },
    currencySpecific: {
      [Currency.USD]: 0.5,
      [Currency.EUR]: 0.5,
      [Currency.GBP]: 0.5,
      [Currency.JPY]: 0.5,
      [Currency.NXR]: 0.1,
      [Currency.USDT]: 0.25,
      [Currency.USDC]: 0.25,
      [Currency.BNB]: 0.25,
      [Currency.ETH]: 0.25,
      [Currency.BTC]: 0.25,
    },
    minimumFee: {
      amount: 0.50,
      currency: Currency.USD,
    },
  },
  
  feeLimits: {
    minimumFee: {
      amount: 0.50,
      currency: Currency.USD,
    },
    maximumPercentage: 10.0,
  },
  
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Fee engine interface
 */
export interface IFeeEngine {
  // Calculate fees using active configuration
  calculateFees(context: FeeCalculationContext): Promise<DetailedFeeCalculationResult>;
  
  // Get current fee configuration
  getCurrentConfiguration(): FeeConfigurationSchema;
  
  // Get applicable promotions
  getApplicablePromotions(context: FeeCalculationContext): FeePromotionConfig[];
  
  // Apply enterprise fee override
  applyEnterpriseOverride(context: FeeCalculationContext, enterpriseFee: EnterpriseFeeConfig): FeeCalculationContext;
  
  // Apply volume discount
  applyVolumeDiscount(context: FeeCalculationContext, discount: VolumeDiscountConfig): FeeCalculationContext;
  
  // Apply promotion
  applyPromotion(context: FeeCalculationContext, promotion: FeePromotionConfig): FeeCalculationContext;
}
