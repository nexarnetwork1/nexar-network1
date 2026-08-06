/**
 * ATLAS NXR — domain types.
 * Native utility token of ATLAS. Works without blockchain.
 * Prefixed Nxr*. Fiat Wallet masters remain in wallet context.
 */

export type NxrAccountKind =
  | "personal"
  | "business"
  | "treasury"
  | "reward_pool"
  | "reserve"
  | "developer";

export type NxrTxKind =
  | "transfer"
  | "reward"
  | "purchase"
  | "subscription"
  | "ai_credit"
  | "advertising"
  | "verification"
  | "boost"
  | "app_purchase"
  | "developer_payout"
  | "mint"
  | "burn"
  | "deposit"
  | "withdraw"
  | "cashback"
  | "adjustment";

export type NxrTxStatus = "pending" | "completed" | "failed" | "reversed";

export type NxrRewardKind =
  | "business_activity"
  | "referral"
  | "marketplace"
  | "loyalty"
  | "campaign"
  | "community"
  | "achievement"
  | "custom";

export type NxrLoyaltyTier =
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "enterprise";

export type NxrUtility =
  | "subscription"
  | "marketplace"
  | "app_purchase"
  | "premium_feature"
  | "ai_credits"
  | "advertising"
  | "verification"
  | "boost"
  | "developer_revenue";

export type NxrPremiumFeature =
  | "featured_business"
  | "featured_product"
  | "sponsored_post"
  | "sponsored_company"
  | "verified_badge"
  | "ai_credits"
  | "offline_pro"
  | "analytics_premium"
  | "custom";

export type NxrAccount = {
  id: string;
  owner_user_id: string | null;
  business_id: string | null;
  kind: NxrAccountKind;
  fiat_wallet_id: string | null;
  balance: number;
  locked_balance: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type NxrTransaction = {
  id: string;
  tx_number: string;
  kind: NxrTxKind;
  status: NxrTxStatus;
  from_account_id: string | null;
  to_account_id: string | null;
  amount: number;
  utility: NxrUtility | null;
  reference_type: string | null;
  reference_id: string | null;
  memo: string | null;
  fiat_amount: number | null;
  fiat_currency: string | null;
  exchange_rate: number | null;
  actor_user_id: string | null;
  business_id: string | null;
  metadata: Record<string, unknown>;
  completed_at: string | null;
  created_at: string;
};

export type NxrRewardRule = {
  id: string;
  code: string;
  name: string;
  kind: NxrRewardKind;
  amount: number;
  percent_of_amount: number | null;
  max_per_user: number | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type NxrLoyaltyAccount = {
  id: string;
  user_id: string | null;
  business_id: string | null;
  nxr_account_id: string | null;
  tier: NxrLoyaltyTier;
  points: number;
  lifetime_earned: number;
  cashback_rate: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

/** Fiat / payment masters NXR consumes — never owns. */
export const NXR_CONSUMES = [
  "Wallet",
  "LedgerEntry",
  "Business",
  "User",
  "Invoice",
  "Payment",
  "Order",
] as const;

export const NXR_UTILITIES: NxrUtility[] = [
  "subscription",
  "marketplace",
  "app_purchase",
  "premium_feature",
  "ai_credits",
  "advertising",
  "verification",
  "boost",
  "developer_revenue",
];

export const LOYALTY_TIER_THRESHOLDS: Array<{
  tier: NxrLoyaltyTier;
  minLifetimeEarned: number;
}> = [
  { tier: "bronze", minLifetimeEarned: 0 },
  { tier: "silver", minLifetimeEarned: 100 },
  { tier: "gold", minLifetimeEarned: 500 },
  { tier: "platinum", minLifetimeEarned: 2000 },
  { tier: "enterprise", minLifetimeEarned: 10000 },
];

export const NXR_EVENT_HANDLERS: Record<
  string,
  { action: "reward" | "bill" | "provision"; description: string }
> = {
  "business.created": {
    action: "provision",
    description: "Provision business NXR account + loyalty",
  },
  "user.registered": {
    action: "provision",
    description: "Provision personal NXR account",
  },
  "order.paid": {
    action: "reward",
    description: "Marketplace cashback / loyalty",
  },
  "payment.confirmed": {
    action: "bill",
    description: "Optional NXR settlement signal",
  },
  "business.verification_approved": {
    action: "reward",
    description: "Verification reward",
  },
};

export type EnsureNxrAccountInput = {
  kind: "personal" | "business";
  userId?: string;
  businessId?: string;
  fiatWalletId?: string;
};

export type TransferNxrInput = {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  memo?: string;
  actorUserId?: string;
  businessId?: string;
  utility?: NxrUtility;
  referenceType?: string;
  referenceId?: string;
};

export type PayWithNxrInput = {
  payerAccountId: string;
  payeeAccountId?: string;
  amount: number;
  utility: NxrUtility;
  actorUserId?: string;
  businessId?: string;
  referenceType?: string;
  referenceId?: string;
  memo?: string;
};

export type GrantRewardInput = {
  toAccountId: string;
  ruleCode: string;
  baseAmount?: number;
  campaignId?: string;
  actorUserId?: string;
  businessId?: string;
  referenceType?: string;
  referenceId?: string;
};
