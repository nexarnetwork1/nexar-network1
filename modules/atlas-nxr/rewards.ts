/**
 * ATLAS NXR — reward & loyalty engine (pure).
 */

import {
  LOYALTY_TIER_THRESHOLDS,
  type NxrLoyaltyTier,
  type NxrRewardKind,
} from "./types";
import { round8 } from "./ledger";

export type RewardRuleSnapshot = {
  code: string;
  kind: NxrRewardKind;
  amount: number;
  percentOfAmount: number | null;
  maxPerUser: number | null;
  isActive: boolean;
};

export type ComputedReward = {
  amount: number;
  kind: NxrRewardKind;
  reason: string;
};

export function computeRewardAmount(
  rule: RewardRuleSnapshot,
  baseAmount = 0,
): ComputedReward | null {
  if (!rule.isActive) return null;
  let amount = Number(rule.amount) || 0;
  if (rule.percentOfAmount && baseAmount > 0) {
    amount = round8(baseAmount * Number(rule.percentOfAmount));
  }
  if (amount <= 0) return null;
  if (rule.maxPerUser != null && amount > rule.maxPerUser) {
    amount = Number(rule.maxPerUser);
  }
  return {
    amount,
    kind: rule.kind,
    reason: `rule:${rule.code}`,
  };
}

export function resolveLoyaltyTier(
  lifetimeEarned: number,
): NxrLoyaltyTier {
  let tier: NxrLoyaltyTier = "bronze";
  for (const row of LOYALTY_TIER_THRESHOLDS) {
    if (lifetimeEarned >= row.minLifetimeEarned) tier = row.tier;
  }
  return tier;
}

export function computeCashback(
  purchaseAmount: number,
  cashbackRate: number,
): number {
  if (purchaseAmount <= 0 || cashbackRate <= 0) return 0;
  return round8(purchaseAmount * cashbackRate);
}

export function campaignBudgetRemaining(
  budget: number,
  spent: number,
): number {
  return Math.max(0, round8(budget - spent));
}
