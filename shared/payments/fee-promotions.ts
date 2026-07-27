// Fee Promotion System
// This file defines the promotional campaign and temporary fee override system

import {
  Money,
  Currency,
  PaymentMethodType,
} from './types';
import {
  FeePromotionConfig,
  FeeCalculationContext,
  AppliedPromotion,
  DetailedFeeCalculationResult,
} from './fee-config';

/**
 * Promotion eligibility criteria
 */
export interface PromotionEligibilityCriteria {
  merchantIds?: string[];
  enterpriseIds?: string[];
  currencies?: Currency[];
  paymentMethods?: PaymentMethodType[];
  minimumVolume?: Money;
  maximumVolume?: Money;
  minimumTransactionAmount?: Money;
  maximumTransactionAmount?: Money;
  customerRegions?: string[];
  newCustomersOnly?: boolean;
  existingCustomersOnly?: boolean;
  firstTransactionOnly?: boolean;
}

/**
 * Promotion campaign
 */
export interface PromotionCampaign {
  id: string;
  name: string;
  description: string;
  campaignType: 'launch' | 'seasonal' | 'limited_time' | 'referral' | 'enterprise' | 'custom';
  promotions: FeePromotionConfig[];
  eligibilityCriteria: PromotionEligibilityCriteria;
  campaignStartDate: Date;
  campaignEndDate: Date;
  isActive: boolean;
  maxParticipants?: number;
  currentParticipants?: number;
  priority: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Promotion usage tracking
 */
export interface PromotionUsage {
  promotionId: string;
  merchantId: string;
  usageCount: number;
  lastUsedAt: Date;
  totalDiscountAmount: Money;
  remainingUses?: number;
}

/**
 * Promotion validation result
 */
export interface PromotionEligibilityResult {
  valid: boolean;
  eligible: boolean;
  errors: string[];
  warnings: string[];
  maxUsesReached: boolean;
  expired: boolean;
  notStarted: boolean;
}

/**
 * Promotion service interface
 */
export interface IPromotionService {
  // Campaign management
  createCampaign(campaign: Partial<PromotionCampaign>): Promise<PromotionCampaign>;
  getCampaign(campaignId: string): Promise<PromotionCampaign>;
  getActiveCampaigns(date?: Date): Promise<PromotionCampaign[]>;
  updateCampaign(campaignId: string, campaign: Partial<PromotionCampaign>): Promise<PromotionCampaign>;
  deactivateCampaign(campaignId: string): Promise<void>;
  
  // Promotion management
  addPromotionToCampaign(campaignId: string, promotion: FeePromotionConfig): Promise<FeePromotionConfig>;
  removePromotionFromCampaign(campaignId: string, promotionId: string): Promise<void>;
  
  // Eligibility checking
  checkPromotionEligibility(
    promotion: FeePromotionConfig,
    context: FeeCalculationContext
  ): Promise<PromotionEligibilityResult>;
  
  checkCampaignEligibility(
    campaign: PromotionCampaign,
    context: FeeCalculationContext
  ): Promise<PromotionEligibilityResult>;
  
  // Promotion application
  applyPromotion(
    context: FeeCalculationContext,
    promotion: FeePromotionConfig
  ): Promise<{ context: FeeCalculationContext; appliedPromotion: AppliedPromotion }>;
  
  applyBestPromotion(
    context: FeeCalculationContext,
    promotions: FeePromotionConfig[]
  ): Promise<{ context: FeeCalculationContext; appliedPromotion: AppliedPromotion | null }>;
  
  // Usage tracking
  trackPromotionUsage(merchantId: string, promotionId: string, discountAmount: Money): Promise<void>;
  getPromotionUsage(merchantId: string, promotionId: string): Promise<PromotionUsage>;
  getMerchantPromotionUsage(merchantId: string): Promise<PromotionUsage[]>;
  
  // Reporting
  getCampaignPerformance(campaignId: string): Promise<CampaignPerformance>;
  getPromotionPerformance(promotionId: string): Promise<PromotionPerformance>;
}

/**
 * Campaign performance metrics
 */
export interface CampaignPerformance {
  campaignId: string;
  totalUses: number;
  totalDiscountAmount: Money;
  totalTransactionVolume: Money;
  averageDiscountPercentage: number;
  merchantCount: number;
  conversionRate: number;
  startDate: Date;
  endDate: Date;
  dataPoints: PerformanceDataPoint[];
}

/**
 * Promotion performance metrics
 */
export interface PromotionPerformance {
  promotionId: string;
  totalUses: number;
  totalDiscountAmount: Money;
  totalTransactionVolume: Money;
  averageDiscountPercentage: number;
  merchantCount: number;
  conversionRate: number;
  startDate: Date;
  endDate: Date;
  dataPoints: PerformanceDataPoint[];
}

/**
 * Performance data point
 */
export interface PerformanceDataPoint {
  date: Date;
  uses: number;
  discountAmount: Money;
  transactionVolume: Money;
}

/**
 * Launch promotion template
 */
export const LAUNCH_PROMOTION_TEMPLATE: Partial<PromotionCampaign> = {
  name: 'NXR Launch Promotion',
  description: 'Zero fee promotion for NXR token launch',
  campaignType: 'launch',
  eligibilityCriteria: {
    currencies: [Currency.NXR],
    newCustomersOnly: false,
  },
  priority: 100, // Highest priority
};

/**
 * Seasonal promotion template
 */
export const SEASONAL_PROMOTION_TEMPLATE: Partial<PromotionCampaign> = {
  name: 'Seasonal Discount',
  description: 'Seasonal fee discount campaign',
  campaignType: 'seasonal',
  eligibilityCriteria: {},
  priority: 50,
};

/**
 * Referral promotion template
 */
export const REFERRAL_PROMOTION_TEMPLATE: Partial<PromotionCampaign> = {
  name: 'Referral Discount',
  description: 'Discount for referred customers',
  campaignType: 'referral',
  eligibilityCriteria: {
    newCustomersOnly: true,
  },
  priority: 75,
};

/**
 * Enterprise promotion template
 */
export const ENTERPRISE_PROMOTION_TEMPLATE: Partial<PromotionCampaign> = {
  name: 'Enterprise Custom Fee',
  description: 'Custom fee structure for enterprise clients',
  campaignType: 'enterprise',
  eligibilityCriteria: {
    minimumVolume: {
      amount: 100000,
      currency: Currency.USD,
    },
  },
  priority: 90,
};

/**
 * Check if promotion is currently active
 */
export function isPromotionActive(promotion: FeePromotionConfig, date: Date = new Date()): boolean {
  if (!promotion.isActive) {
    return false;
  }
  
  const now = date.getTime();
  const start = promotion.effectiveFrom.getTime();
  const end = promotion.effectiveTo.getTime();
  
  return now >= start && now <= end;
}

/**
 * Check if campaign is currently active
 */
export function isCampaignActive(campaign: PromotionCampaign, date: Date = new Date()): boolean {
  if (!campaign.isActive) {
    return false;
  }
  
  const now = date.getTime();
  const start = campaign.campaignStartDate.getTime();
  const end = campaign.campaignEndDate.getTime();
  
  return now >= start && now <= end;
}

/**
 * Check if promotion usage limit is reached
 */
export function isPromotionUsageLimitReached(promotion: FeePromotionConfig, usage: PromotionUsage): boolean {
  if (promotion.maxUses === undefined) {
    return false;
  }
  
  return usage.usageCount >= promotion.maxUses;
}

/**
 * Check if promotion has started
 */
export function hasPromotionStarted(promotion: FeePromotionConfig, date: Date = new Date()): boolean {
  return date >= promotion.effectiveFrom;
}

/**
 * Check if promotion has expired
 */
export function hasPromotionExpired(promotion: FeePromotionConfig, date: Date = new Date()): boolean {
  return date > promotion.effectiveTo;
}

/**
 * Calculate promotion discount amount
 */
export function calculatePromotionDiscount(
  originalFee: Money,
  promotion: FeePromotionConfig
): Money {
  switch (promotion.type) {
    case 'zero_fee':
      return {
        amount: 0,
        currency: originalFee.currency,
      };
    
    case 'percentage_discount':
      const discountAmount = originalFee.amount * (promotion.value / 100);
      return {
        amount: discountAmount,
        currency: originalFee.currency,
      };
    
    case 'fixed_amount':
      const currency = promotion.currency || originalFee.currency;
      return {
        amount: Math.min(promotion.value, originalFee.amount),
        currency,
      };
    
    case 'custom_fee':
      // Custom fee calculation would be handled separately
      return {
        amount: 0,
        currency: originalFee.currency,
      };
    
    default:
      return {
        amount: 0,
        currency: originalFee.currency,
      };
  }
}

/**
 * Validate promotion eligibility
 * Placeholder for future implementation
 */
export function validatePromotionEligibility(
  promotion: FeePromotionConfig,
  context: FeeCalculationContext
): PromotionEligibilityResult {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Check promotion is active
  // 2. Check time validity
  // 3. Check currency eligibility
  // 4. Check payment method eligibility
  // 5. Check enterprise eligibility
  // 6. Check volume requirements
  // 7. Check usage limits
  // 8. Return validation result
  
  return {
    valid: true,
    eligible: true,
    errors: [],
    warnings: [],
    maxUsesReached: false,
    expired: false,
    notStarted: false,
  };
}

/**
 * Sort promotions by priority
 */
export function sortPromotionsByPriority(promotions: FeePromotionConfig[]): FeePromotionConfig[] {
  return [...promotions].sort((a, b) => b.priority - a.priority);
}

/**
 * Get best promotion for context
 */
export function getBestPromotion(
  context: FeeCalculationContext,
  promotions: FeePromotionConfig[]
): FeePromotionConfig | null {
  const activePromotions = promotions.filter(p => isPromotionActive(p));
  const sortedPromotions = sortPromotionsByPriority(activePromotions);
  
  for (const promotion of sortedPromotions) {
    const validation = validatePromotionEligibility(promotion, context);
    if (validation.eligible) {
      return promotion;
    }
  }
  
  return null;
}

/**
 * Calculate combined promotion effect
 */
export function calculateCombinedPromotionEffect(
  originalFee: Money,
  promotions: FeePromotionConfig[]
): { totalDiscount: Money; appliedPromotions: AppliedPromotion[] } {
  let totalDiscount = 0;
  const appliedPromotions: AppliedPromotion[] = [];
  
  for (const promotion of promotions) {
    const discount = calculatePromotionDiscount(originalFee, promotion);
    totalDiscount += discount.amount;
    
    appliedPromotions.push({
      promotionId: promotion.id,
      promotionName: promotion.name,
      type: promotion.type,
      discountAmount: discount,
      priority: promotion.priority,
    });
  }
  
  return {
    totalDiscount: {
      amount: totalDiscount,
      currency: originalFee.currency,
    },
    appliedPromotions,
  };
}

/**
 * Promotion campaign factory
 */
export class PromotionCampaignFactory {
  static createLaunchPromotion(
    name: string,
    startDate: Date,
    endDate: Date,
    currencies: Currency[]
  ): Partial<PromotionCampaign> {
    return {
      ...LAUNCH_PROMOTION_TEMPLATE,
      name,
      campaignStartDate: startDate,
      campaignEndDate: endDate,
      eligibilityCriteria: {
        currencies,
        newCustomersOnly: false,
      },
    };
  }
  
  static createSeasonalPromotion(
    name: string,
    startDate: Date,
    endDate: Date,
    discountPercentage: number
  ): Partial<PromotionCampaign> {
    return {
      ...SEASONAL_PROMOTION_TEMPLATE,
      name,
      campaignStartDate: startDate,
      campaignEndDate: endDate,
      promotions: [
        {
          id: `seasonal-${Date.now()}`,
          name,
          type: 'percentage_discount',
          value: discountPercentage,
          effectiveFrom: startDate,
          effectiveTo: endDate,
          isActive: true,
          priority: 50,
        } as FeePromotionConfig,
      ],
    };
  }
  
  static createReferralPromotion(
    name: string,
    startDate: Date,
    endDate: Date,
    discountPercentage: number
  ): Partial<PromotionCampaign> {
    return {
      ...REFERRAL_PROMOTION_TEMPLATE,
      name,
      campaignStartDate: startDate,
      campaignEndDate: endDate,
      promotions: [
        {
          id: `referral-${Date.now()}`,
          name,
          type: 'percentage_discount',
          value: discountPercentage,
          effectiveFrom: startDate,
          effectiveTo: endDate,
          isActive: true,
          priority: 75,
        } as FeePromotionConfig,
      ],
    };
  }
  
  static createEnterprisePromotion(
    name: string,
    enterpriseId: string,
    customFeePercentage: number,
    startDate: Date,
    endDate: Date
  ): Partial<PromotionCampaign> {
    return {
      ...ENTERPRISE_PROMOTION_TEMPLATE,
      name,
      campaignStartDate: startDate,
      campaignEndDate: endDate,
      eligibilityCriteria: {
        enterpriseIds: [enterpriseId],
        minimumVolume: {
          amount: 100000,
          currency: Currency.USD,
        },
      },
      promotions: [
        {
          id: `enterprise-${enterpriseId}-${Date.now()}`,
          name,
          type: 'custom_fee',
          value: customFeePercentage,
          effectiveFrom: startDate,
          effectiveTo: endDate,
          isActive: true,
          priority: 90,
          enterprises: [enterpriseId],
        } as FeePromotionConfig,
      ],
    };
  }
}
