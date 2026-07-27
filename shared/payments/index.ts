// Payment engine exports
// This file exports all payment engine modules

// Core types
export * from './types';

// Payment intent
export * from './payment-intent';

// Payment session
export * from './payment-session';

// Invoice
export * from './invoice';

// Transaction
export * from './transaction';

// Settlement
export * from './settlement';

// Fees - specific exports to avoid conflicts
export type {
  FeeConfiguration,
  ProcessingFeeConfig,
  VolumeDiscount,
  FeeCalculationParams,
  FeeCalculationResult,
  BasicFeeBreakdown,
  IFeeService,
} from './fees';

export {
  DEFAULT_FEE_CONFIGURATION as DEFAULT_BASIC_FEE_CONFIGURATION,
  PAYMENT_METHOD_FEE_STRUCTURES,
  calculateProcessingFee,
  calculatePlatformFee,
  calculateInternationalFee,
  calculateCurrencyConversionFee,
  applyVolumeDiscount,
  applyFeeCaps,
  calculateTotalFees,
  calculateNetAmount,
  getFeeBreakdown,
  validateFeeParams,
} from './fees';

// Fee configuration - specific exports to avoid conflicts
export type {
  FeeConfigurationSchema,
  CurrencyFeeConfig,
  PaymentMethodFeeConfig,
  EnterpriseFeeConfig,
  VolumeDiscountConfig,
  PlatformFeeConfig,
  FeeLimitsConfig,
  FeePromotionConfig,
  FeeCalculationContext,
  DetailedFeeCalculationResult,
  DetailedFeeBreakdownItem,
  AppliedPromotion,
  IFeeConfigurationService,
  IFeeEngine,
  FeeConfigValidationResult,
  FeeConfigValidationError,
} from './fee-config';

export {
  DEFAULT_FEE_CONFIGURATION,
} from './fee-config';

// Fee promotions - specific exports to avoid conflicts
export type {
  PromotionEligibilityCriteria,
  PromotionCampaign,
  PromotionUsage,
  PromotionEligibilityResult,
  IPromotionService,
  CampaignPerformance,
  PromotionPerformance,
  PerformanceDataPoint,
} from './fee-promotions';

export {
  LAUNCH_PROMOTION_TEMPLATE,
  SEASONAL_PROMOTION_TEMPLATE,
  REFERRAL_PROMOTION_TEMPLATE,
  ENTERPRISE_PROMOTION_TEMPLATE,
  isPromotionActive,
  isCampaignActive,
  isPromotionUsageLimitReached,
  hasPromotionStarted,
  hasPromotionExpired,
  calculatePromotionDiscount,
  validatePromotionEligibility,
  sortPromotionsByPriority,
  getBestPromotion,
  calculateCombinedPromotionEffect,
  PromotionCampaignFactory,
} from './fee-promotions';

// Status lifecycle
export * from './status';

// Status provider
export * from './status-provider';

// Network support
export * from './network';

// Refund
export * from './refund';

// Currency
export * from './currency';
