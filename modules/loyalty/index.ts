import { loyaltyConfig } from "@/config/loyalty";

/**
 * Loyalty architecture — inactive until loyaltyConfig.enabled is true.
 * Tables: loyalty_programs, loyalty_accounts, loyalty_transactions
 */
export { loyaltyConfig };

export type LoyaltyFeature =
  | "rewardPoints"
  | "cashback"
  | "referralRewards"
  | "vipLevels"
  | "campaigns";

export function isLoyaltyEnabled(): boolean {
  return loyaltyConfig.enabled;
}
