/**
 * ATLAS NXR — billing integration contracts (pure).
 * Maps ATLAS utilities → optional NXR payment intents.
 * Traditional payments remain fully supported without NXR.
 */

import type { NxrPremiumFeature, NxrUtility } from "./types";

export type BillingIntent = {
  utility: NxrUtility;
  amountNxr: number;
  referenceType: string;
  referenceId?: string;
  description: string;
  optional: true;
};

export type PremiumPriceTable = Partial<Record<NxrPremiumFeature, number>>;

export const DEFAULT_PREMIUM_PRICES: PremiumPriceTable = {
  featured_business: 100,
  featured_product: 25,
  sponsored_post: 15,
  sponsored_company: 80,
  verified_badge: 50,
  ai_credits: 10,
  offline_pro: 20,
  analytics_premium: 30,
};

export function buildSubscriptionIntent(input: {
  planCode: string;
  amountNxr: number;
  subscriptionId?: string;
}): BillingIntent {
  return {
    utility: "subscription",
    amountNxr: input.amountNxr,
    referenceType: "subscription",
    referenceId: input.subscriptionId,
    description: `ATLAS plan ${input.planCode}`,
    optional: true,
  };
}

export function buildMarketplaceIntent(input: {
  orderId: string;
  amountNxr: number;
}): BillingIntent {
  return {
    utility: "marketplace",
    amountNxr: input.amountNxr,
    referenceType: "order",
    referenceId: input.orderId,
    description: "Marketplace purchase with NXR",
    optional: true,
  };
}

export function buildAppPurchaseIntent(input: {
  applicationId: string;
  amountNxr: number;
}): BillingIntent {
  return {
    utility: "app_purchase",
    amountNxr: input.amountNxr,
    referenceType: "application",
    referenceId: input.applicationId,
    description: "App Store purchase with NXR",
    optional: true,
  };
}

export function buildAiCreditIntent(input: {
  credits: number;
  pricePerCredit?: number;
}): BillingIntent {
  const price = input.pricePerCredit ?? 1;
  return {
    utility: "ai_credits",
    amountNxr: input.credits * price,
    referenceType: "ai_credits",
    description: `${input.credits} AI credits`,
    optional: true,
  };
}

export function buildPremiumIntent(
  feature: NxrPremiumFeature,
  prices: PremiumPriceTable = DEFAULT_PREMIUM_PRICES,
): BillingIntent | null {
  const amount = prices[feature];
  if (amount == null) return null;
  return {
    utility: "premium_feature",
    amountNxr: amount,
    referenceType: "premium_feature",
    referenceId: undefined,
    description: `Activate ${feature}`,
    optional: true,
  };
}

export function developerRevenueShare(input: {
  grossNxr: number;
  platformShareRate?: number;
}): { platform: number; developer: number } {
  const rate = input.platformShareRate ?? 0.3;
  const platform = Math.round(input.grossNxr * rate * 1e8) / 1e8;
  const developer = Math.round((input.grossNxr - platform) * 1e8) / 1e8;
  return { platform, developer };
}
