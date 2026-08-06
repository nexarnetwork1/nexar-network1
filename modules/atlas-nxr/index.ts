/**
 * ATLAS NXR — Digital Economy Layer.
 * Native utility token — blockchain-agnostic; chain adapters optional.
 */

export type {
  NxrAccount,
  NxrTransaction,
  NxrRewardRule,
  NxrLoyaltyAccount,
  NxrAccountKind,
  NxrTxKind,
  NxrUtility,
  NxrPremiumFeature,
  NxrLoyaltyTier,
  EnsureNxrAccountInput,
  TransferNxrInput,
  PayWithNxrInput,
  GrantRewardInput,
} from "./types";

export {
  NXR_CONSUMES,
  NXR_UTILITIES,
  NXR_EVENT_HANDLERS,
  LOYALTY_TIER_THRESHOLDS,
} from "./types";

export {
  applyTransfer,
  applyCredit,
  applyDebit,
  convertNxrToFiat,
  convertFiatToNxr,
  checkRateLimit,
} from "./ledger";

export {
  computeRewardAmount,
  resolveLoyaltyTier,
  computeCashback,
  campaignBudgetRemaining,
} from "./rewards";

export {
  buildSubscriptionIntent,
  buildMarketplaceIntent,
  buildAppPurchaseIntent,
  buildAiCreditIntent,
  buildPremiumIntent,
  developerRevenueShare,
  DEFAULT_PREMIUM_PRICES,
} from "./billing";

export type {
  NxrBlockchainAdapter,
  BlockchainNetworkId,
  NxrBlockchainAdapterRegistry,
} from "./blockchain-adapters";

export {
  createEmptyBlockchainRegistry,
  assertBlockchainOptional,
} from "./blockchain-adapters";

export {
  ensureNxrAccount,
  transferNxr,
  payWithNxr,
  grantReward,
  fundAccount,
  activatePremium,
  burnNxr,
  handleNxrDomainEvent,
  createAtlasNxrPort,
  setNxrBlockchainRegistry,
  getNxrBlockchainRegistry,
} from "./service";

export { registerAtlasNxrEventHandlers } from "./events";

export {
  ensureNxrAccountSchema,
  transferNxrSchema,
  payWithNxrSchema,
  grantRewardSchema,
} from "./validators";
