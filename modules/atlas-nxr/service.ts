import "server-only";

import { randomUUID } from "node:crypto";
import { publishDomainEvent, type DomainEvent } from "@/domains";
import type {
  AtlasNxrPort,
  NxrAccountRecord,
  NxrTransactionRecord,
} from "@/domains/contracts/ports";
import {
  buildAiCreditIntent,
  buildAppPurchaseIntent,
  buildMarketplaceIntent,
  buildPremiumIntent,
  buildSubscriptionIntent,
  developerRevenueShare,
  DEFAULT_PREMIUM_PRICES,
} from "./billing";
import {
  createEmptyBlockchainRegistry,
  type NxrBlockchainAdapterRegistry,
} from "./blockchain-adapters";
import { applyCredit, applyDebit, applyTransfer, convertNxrToFiat } from "./ledger";
import {
  computeRewardAmount,
  resolveLoyaltyTier,
} from "./rewards";
import {
  bumpCirculatingSupply,
  createAccount,
  ensureLoyaltyAccount,
  ensureSystemAccounts,
  getAccountById,
  getBusinessAccount,
  getExchangeRate,
  getPersonalAccount,
  getRewardRuleByCode,
  getSystemAccountByKind,
  getTokenConfig,
  insertBurnEvent,
  insertMintEvent,
  insertPremiumActivation,
  insertReward,
  insertTokenPayment,
  insertTransaction,
  nextTxNumber,
  updateAccountBalance,
  updateLoyalty,
  upsertBusinessCredits,
  writeNxrAudit,
} from "./repository";
import type {
  EnsureNxrAccountInput,
  GrantRewardInput,
  NxrAccount,
  NxrPremiumFeature,
  NxrTransaction,
  PayWithNxrInput,
  TransferNxrInput,
} from "./types";
import {
  ensureNxrAccountSchema,
  grantRewardSchema,
  payWithNxrSchema,
  transferNxrSchema,
} from "./validators";

let blockchainRegistry: NxrBlockchainAdapterRegistry =
  createEmptyBlockchainRegistry();

export function setNxrBlockchainRegistry(
  registry: NxrBlockchainAdapterRegistry,
): void {
  blockchainRegistry = registry;
}

export function getNxrBlockchainRegistry(): NxrBlockchainAdapterRegistry {
  return blockchainRegistry;
}

async function emit(
  name: DomainEvent["name"],
  input: {
    actorId: string | null;
    businessId: string | null;
    payload: Record<string, unknown>;
  },
) {
  await publishDomainEvent({
    id: randomUUID(),
    name,
    occurredAt: new Date(),
    actorId: input.actorId,
    businessId: input.businessId,
    payload: input.payload,
    correlationId: randomUUID(),
  });
}

function toAccountRecord(a: NxrAccount): NxrAccountRecord {
  return {
    id: a.id,
    kind: a.kind,
    ownerUserId: a.owner_user_id,
    businessId: a.business_id,
    balance: Number(a.balance),
    lockedBalance: Number(a.locked_balance),
    isActive: a.is_active,
  };
}

function toTxRecord(t: NxrTransaction): NxrTransactionRecord {
  return {
    id: t.id,
    txNumber: t.tx_number,
    kind: t.kind,
    status: t.status,
    amount: Number(t.amount),
    fromAccountId: t.from_account_id,
    toAccountId: t.to_account_id,
    utility: t.utility,
  };
}

export async function ensureNxrAccount(
  input: EnsureNxrAccountInput,
): Promise<NxrAccountRecord> {
  ensureNxrAccountSchema.parse(input);
  await ensureSystemAccounts();

  if (input.kind === "personal") {
    if (!input.userId) throw new Error("userId required for personal account");
    const existing = await getPersonalAccount(input.userId);
    if (existing) return toAccountRecord(existing);
    const account = await createAccount({
      kind: "personal",
      ownerUserId: input.userId,
      fiatWalletId: input.fiatWalletId,
    });
    await ensureLoyaltyAccount({
      userId: input.userId,
      nxrAccountId: account.id,
    });
    await writeNxrAudit({
      action: "wallet_created",
      accountId: account.id,
      actorUserId: input.userId,
    });
    await emit("nxr.wallet_created", {
      actorId: input.userId,
      businessId: null,
      payload: { accountId: account.id, kind: "personal" },
    });
    return toAccountRecord(account);
  }

  if (!input.businessId) throw new Error("businessId required for business account");
  const existing = await getBusinessAccount(input.businessId);
  if (existing) return toAccountRecord(existing);
  const account = await createAccount({
    kind: "business",
    businessId: input.businessId,
    fiatWalletId: input.fiatWalletId,
  });
  await ensureLoyaltyAccount({
    businessId: input.businessId,
    nxrAccountId: account.id,
  });
  await writeNxrAudit({
    action: "wallet_created",
    accountId: account.id,
    businessId: input.businessId,
  });
  await emit("nxr.wallet_created", {
    actorId: null,
    businessId: input.businessId,
    payload: { accountId: account.id, kind: "business" },
  });
  return toAccountRecord(account);
}

export async function transferNxr(
  input: TransferNxrInput,
): Promise<NxrTransactionRecord> {
  transferNxrSchema.parse(input);
  if (input.fromAccountId === input.toAccountId) {
    throw new Error("Cannot transfer to the same account");
  }

  const from = await getAccountById(input.fromAccountId);
  const to = await getAccountById(input.toAccountId);
  if (!from || !to) throw new Error("NXR account not found");
  if (!from.is_active || !to.is_active) throw new Error("Account inactive");

  const moved = applyTransfer({
    fromBalance: Number(from.balance),
    toBalance: Number(to.balance),
    amount: input.amount,
  });
  if (!moved.ok) throw new Error(moved.error);

  await updateAccountBalance(from.id, moved.fromNext);
  await updateAccountBalance(to.id, moved.toNext);

  const rate = await getExchangeRate("USD");
  const tx = await insertTransaction({
    txNumber: await nextTxNumber(),
    kind: "transfer",
    status: "completed",
    fromAccountId: from.id,
    toAccountId: to.id,
    amount: input.amount,
    utility: input.utility,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    memo: input.memo,
    fiatAmount: convertNxrToFiat(input.amount, rate),
    fiatCurrency: "USD",
    exchangeRate: rate,
    actorUserId: input.actorUserId,
    businessId: input.businessId,
    completedAt: new Date().toISOString(),
  });

  await writeNxrAudit({
    action: "token_transferred",
    accountId: from.id,
    transactionId: tx.id,
    actorUserId: input.actorUserId,
    businessId: input.businessId,
    payload: { amount: input.amount, to: to.id },
  });

  await emit("nxr.token_transferred", {
    actorId: input.actorUserId ?? null,
    businessId: input.businessId ?? null,
    payload: {
      transactionId: tx.id,
      fromAccountId: from.id,
      toAccountId: to.id,
      amount: input.amount,
    },
  });

  return toTxRecord(tx);
}

export async function payWithNxr(
  input: PayWithNxrInput,
): Promise<NxrTransactionRecord> {
  payWithNxrSchema.parse(input);
  await ensureSystemAccounts();

  const payeeId =
    input.payeeAccountId ??
    (await getSystemAccountByKind("treasury"))?.id;
  if (!payeeId) throw new Error("Payee / treasury account unavailable");

  const kind =
    input.utility === "subscription"
      ? "subscription"
      : input.utility === "ai_credits"
        ? "ai_credit"
        : input.utility === "app_purchase"
          ? "app_purchase"
          : input.utility === "advertising" || input.utility === "boost"
            ? "advertising"
            : input.utility === "verification"
              ? "verification"
              : "purchase";

  const txTransfer = await transferNxr({
    fromAccountId: input.payerAccountId,
    toAccountId: payeeId,
    amount: input.amount,
    actorUserId: input.actorUserId,
    businessId: input.businessId,
    utility: input.utility,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    memo: input.memo,
  });

  // Re-tag kind for billing utilities (transfer already posted; record payment intent)
  await insertTokenPayment({
    payerAccountId: input.payerAccountId,
    payeeAccountId: payeeId,
    amount: input.amount,
    utility: input.utility,
    status: "completed",
    transactionId: txTransfer.id,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
  });

  if (input.utility === "subscription") {
    await emit("nxr.subscription_paid", {
      actorId: input.actorUserId ?? null,
      businessId: input.businessId ?? null,
      payload: { transactionId: txTransfer.id, amount: input.amount },
    });
  }
  if (input.utility === "marketplace") {
    await emit("nxr.marketplace_purchase_paid", {
      actorId: input.actorUserId ?? null,
      businessId: input.businessId ?? null,
      payload: { transactionId: txTransfer.id, amount: input.amount },
    });
  }

  void kind;
  return txTransfer;
}

export async function grantReward(
  input: GrantRewardInput,
): Promise<{ rewardId: string; amount: number; transactionId: string }> {
  grantRewardSchema.parse(input);
  await ensureSystemAccounts();

  const rule = await getRewardRuleByCode(input.ruleCode);
  if (!rule) throw new Error(`Reward rule not found: ${input.ruleCode}`);

  const computed = computeRewardAmount(
    {
      code: rule.code,
      kind: rule.kind,
      amount: Number(rule.amount),
      percentOfAmount: rule.percent_of_amount
        ? Number(rule.percent_of_amount)
        : null,
      maxPerUser: rule.max_per_user ? Number(rule.max_per_user) : null,
      isActive: rule.is_active,
    },
    input.baseAmount ?? 0,
  );
  if (!computed) throw new Error("Reward amount is zero or rule inactive");

  const pool = await getSystemAccountByKind("reward_pool");
  const to = await getAccountById(input.toAccountId);
  if (!to) throw new Error("Recipient account not found");

  let tx: NxrTransaction;
  if (pool && Number(pool.balance) >= computed.amount) {
    const moved = applyTransfer({
      fromBalance: Number(pool.balance),
      toBalance: Number(to.balance),
      amount: computed.amount,
    });
    if (!moved.ok) throw new Error(moved.error);
    await updateAccountBalance(pool.id, moved.fromNext);
    await updateAccountBalance(to.id, moved.toNext);
    tx = await insertTransaction({
      txNumber: await nextTxNumber(),
      kind: "reward",
      status: "completed",
      fromAccountId: pool.id,
      toAccountId: to.id,
      amount: computed.amount,
      actorUserId: input.actorUserId,
      businessId: input.businessId,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      memo: computed.reason,
      completedAt: new Date().toISOString(),
    });
  } else {
    // Mint into recipient from circulating supply when pool empty (bootstrap)
    const credited = applyCredit(Number(to.balance), computed.amount);
    if (!credited.ok) throw new Error(credited.error);
    await updateAccountBalance(to.id, credited.toNext);
    tx = await insertTransaction({
      txNumber: await nextTxNumber(),
      kind: "mint",
      status: "completed",
      toAccountId: to.id,
      amount: computed.amount,
      actorUserId: input.actorUserId,
      businessId: input.businessId,
      memo: `reward_mint:${computed.reason}`,
      completedAt: new Date().toISOString(),
    });
    await insertMintEvent({
      toAccountId: to.id,
      amount: computed.amount,
      reason: computed.reason,
      transactionId: tx.id,
      actorUserId: input.actorUserId,
    });
    await bumpCirculatingSupply(computed.amount);
  }

  const reward = await insertReward({
    accountId: to.id,
    ruleId: rule.id,
    campaignId: input.campaignId,
    kind: computed.kind,
    amount: computed.amount,
    transactionId: tx.id,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
  });

  const loyalty = await ensureLoyaltyAccount({
    userId: to.owner_user_id ?? undefined,
    businessId: to.business_id ?? input.businessId,
    nxrAccountId: to.id,
  });
  const lifetime = Number(loyalty.lifetime_earned) + computed.amount;
  await updateLoyalty({
    loyaltyId: loyalty.id,
    points: Number(loyalty.points) + computed.amount,
    lifetimeEarned: lifetime,
    tier: resolveLoyaltyTier(lifetime),
  });

  await emit("nxr.reward_granted", {
    actorId: input.actorUserId ?? null,
    businessId: input.businessId ?? to.business_id,
    payload: {
      rewardId: reward.id,
      amount: computed.amount,
      ruleCode: input.ruleCode,
      transactionId: tx.id,
    },
  });

  return {
    rewardId: reward.id,
    amount: computed.amount,
    transactionId: tx.id,
  };
}

export async function fundAccount(input: {
  accountId: string;
  amount: number;
  reason?: string;
  actorUserId?: string;
}): Promise<NxrTransactionRecord> {
  const account = await getAccountById(input.accountId);
  if (!account) throw new Error("Account not found");
  const credited = applyCredit(Number(account.balance), input.amount);
  if (!credited.ok) throw new Error(credited.error);
  await updateAccountBalance(account.id, credited.toNext);
  const tx = await insertTransaction({
    txNumber: await nextTxNumber(),
    kind: "deposit",
    status: "completed",
    toAccountId: account.id,
    amount: input.amount,
    actorUserId: input.actorUserId,
    memo: input.reason ?? "fund",
    completedAt: new Date().toISOString(),
  });
  await insertMintEvent({
    toAccountId: account.id,
    amount: input.amount,
    reason: input.reason ?? "fund",
    transactionId: tx.id,
    actorUserId: input.actorUserId,
  });
  await bumpCirculatingSupply(input.amount);
  await emit("nxr.wallet_funded", {
    actorId: input.actorUserId ?? null,
    businessId: account.business_id,
    payload: { accountId: account.id, amount: input.amount },
  });
  return toTxRecord(tx);
}

export async function activatePremium(input: {
  payerAccountId: string;
  feature: NxrPremiumFeature;
  businessId?: string;
  actorUserId?: string;
}): Promise<{ activationId: string; transactionId: string }> {
  const intent = buildPremiumIntent(input.feature, DEFAULT_PREMIUM_PRICES);
  if (!intent) throw new Error("Unknown premium feature");
  const tx = await payWithNxr({
    payerAccountId: input.payerAccountId,
    amount: intent.amountNxr,
    utility: "premium_feature",
    actorUserId: input.actorUserId,
    businessId: input.businessId,
    referenceType: "premium_feature",
    memo: intent.description,
  });
  const activation = await insertPremiumActivation({
    accountId: input.payerAccountId,
    businessId: input.businessId,
    feature: input.feature,
    amountPaid: intent.amountNxr,
    transactionId: tx.id,
  });
  if (input.feature === "ai_credits" && input.businessId) {
    await upsertBusinessCredits({
      businessId: input.businessId,
      creditType: "ai",
      delta: 100,
    });
  }
  await emit("nxr.premium_activated", {
    actorId: input.actorUserId ?? null,
    businessId: input.businessId ?? null,
    payload: { feature: input.feature, activationId: activation.id },
  });
  return { activationId: activation.id, transactionId: tx.id };
}

export async function burnNxr(input: {
  fromAccountId: string;
  amount: number;
  reason: string;
  actorUserId?: string;
}): Promise<NxrTransactionRecord> {
  const from = await getAccountById(input.fromAccountId);
  if (!from) throw new Error("Account not found");
  const debited = applyDebit(Number(from.balance), input.amount);
  if (!debited.ok) throw new Error(debited.error);
  await updateAccountBalance(from.id, debited.fromNext);
  const tx = await insertTransaction({
    txNumber: await nextTxNumber(),
    kind: "burn",
    status: "completed",
    fromAccountId: from.id,
    amount: input.amount,
    actorUserId: input.actorUserId,
    memo: input.reason,
    completedAt: new Date().toISOString(),
  });
  await insertBurnEvent({
    fromAccountId: from.id,
    amount: input.amount,
    reason: input.reason,
    transactionId: tx.id,
    actorUserId: input.actorUserId,
  });
  await bumpCirculatingSupply(-input.amount);
  return toTxRecord(tx);
}

export async function handleNxrDomainEvent(input: {
  name: string;
  actorId: string | null;
  businessId: string | null;
  payload: Record<string, unknown>;
}): Promise<void> {
  if (input.name === "business.created" && input.businessId) {
    await ensureNxrAccount({ kind: "business", businessId: input.businessId });
    return;
  }
  if (input.name === "user.registered" && input.actorId) {
    await ensureNxrAccount({ kind: "personal", userId: input.actorId });
    return;
  }
  if (input.name === "business.verification_approved" && input.businessId) {
    const account = await ensureNxrAccount({
      kind: "business",
      businessId: input.businessId,
    });
    await grantReward({
      toAccountId: account.id,
      ruleCode: "business_verified",
      actorUserId: input.actorId ?? undefined,
      businessId: input.businessId,
      referenceType: "business",
      referenceId: input.businessId,
    });
    await emit("nxr.business_verified", {
      actorId: input.actorId,
      businessId: input.businessId,
      payload: { accountId: account.id },
    });
    return;
  }
  if (input.name === "order.paid" && input.businessId) {
    const account = await ensureNxrAccount({
      kind: "business",
      businessId: input.businessId,
    });
    const amount = Number(input.payload.amount ?? input.payload.total ?? 0);
    if (amount > 0) {
      await grantReward({
        toAccountId: account.id,
        ruleCode: "marketplace_purchase",
        baseAmount: amount,
        actorUserId: input.actorId ?? undefined,
        businessId: input.businessId,
        referenceType: "order",
        referenceId: input.payload.orderId as string | undefined,
      });
    }
  }
}

export function createAtlasNxrPort(): AtlasNxrPort {
  return {
    async ensureAccount(input) {
      return ensureNxrAccount(input);
    },
    async getAccount(accountId) {
      const a = await getAccountById(accountId);
      return a ? toAccountRecord(a) : null;
    },
    async transfer(input) {
      return transferNxr(input as TransferNxrInput);
    },
    async pay(input) {
      return payWithNxr(input as PayWithNxrInput);
    },
    async grantReward(input) {
      return grantReward(input);
    },
    async fund(input) {
      return fundAccount(input);
    },
    async activatePremium(input) {
      return activatePremium({
        ...input,
        feature: input.feature as NxrPremiumFeature,
      });
    },
  };
}

export {
  buildSubscriptionIntent,
  buildMarketplaceIntent,
  buildAppPurchaseIntent,
  buildAiCreditIntent,
  buildPremiumIntent,
  developerRevenueShare,
  DEFAULT_PREMIUM_PRICES,
  computeRewardAmount,
  resolveLoyaltyTier,
  applyTransfer,
  createEmptyBlockchainRegistry,
  getTokenConfig,
};
