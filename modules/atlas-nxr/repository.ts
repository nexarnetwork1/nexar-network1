import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  NxrAccount,
  NxrLoyaltyAccount,
  NxrRewardRule,
  NxrTransaction,
} from "./types";

function db() {
  return createAdminClient();
}

export async function getTokenConfig(): Promise<{
  id: string;
  symbol: string;
  blockchain_enabled: boolean;
  circulating_supply: number;
  max_supply: number | null;
}> {
  const { data, error } = await db()
    .from("atlas_nxr_token_config")
    .select("id, symbol, blockchain_enabled, circulating_supply, max_supply")
    .limit(1)
    .single();
  if (error || !data) throw new Error(error?.message ?? "NXR config missing");
  return data as {
    id: string;
    symbol: string;
    blockchain_enabled: boolean;
    circulating_supply: number;
    max_supply: number | null;
  };
}

export async function getPersonalAccount(
  userId: string,
): Promise<NxrAccount | null> {
  const { data } = await db()
    .from("atlas_nxr_accounts")
    .select("*")
    .eq("kind", "personal")
    .eq("owner_user_id", userId)
    .maybeSingle();
  return (data as NxrAccount | null) ?? null;
}

export async function getBusinessAccount(
  businessId: string,
): Promise<NxrAccount | null> {
  const { data } = await db()
    .from("atlas_nxr_accounts")
    .select("*")
    .eq("kind", "business")
    .eq("business_id", businessId)
    .maybeSingle();
  return (data as NxrAccount | null) ?? null;
}

export async function getAccountById(
  accountId: string,
): Promise<NxrAccount | null> {
  const { data } = await db()
    .from("atlas_nxr_accounts")
    .select("*")
    .eq("id", accountId)
    .maybeSingle();
  return (data as NxrAccount | null) ?? null;
}

export async function getSystemAccountByKind(
  kind: string,
): Promise<NxrAccount | null> {
  const { data } = await db()
    .from("atlas_nxr_accounts")
    .select("*")
    .eq("kind", kind)
    .limit(1)
    .maybeSingle();
  return (data as NxrAccount | null) ?? null;
}

export async function createAccount(input: {
  kind: string;
  ownerUserId?: string;
  businessId?: string;
  fiatWalletId?: string;
}): Promise<NxrAccount> {
  const { data, error } = await db()
    .from("atlas_nxr_accounts")
    .insert({
      kind: input.kind,
      owner_user_id: input.ownerUserId ?? null,
      business_id: input.businessId ?? null,
      fiat_wallet_id: input.fiatWalletId ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create NXR account");
  return data as NxrAccount;
}

export async function ensureSystemAccounts(): Promise<void> {
  for (const kind of ["treasury", "reward_pool", "reserve", "developer"] as const) {
    const existing = await getSystemAccountByKind(kind);
    if (existing) continue;
    const account = await createAccount({ kind });
    await db().from("atlas_nxr_treasury").insert({
      account_id: account.id,
      role: kind === "developer" ? "developer_incentives" : kind,
      label: `NXR ${kind}`,
    });
  }
}

export async function updateAccountBalance(
  accountId: string,
  balance: number,
): Promise<void> {
  await db()
    .from("atlas_nxr_accounts")
    .update({ balance, updated_at: new Date().toISOString() })
    .eq("id", accountId);
}

export async function nextTxNumber(): Promise<string> {
  const { count } = await db()
    .from("atlas_nxr_transactions")
    .select("*", { count: "exact", head: true });
  return `NXR-${String((count ?? 0) + 1).padStart(8, "0")}`;
}

export async function insertTransaction(input: {
  txNumber: string;
  kind: string;
  status: string;
  fromAccountId?: string;
  toAccountId?: string;
  amount: number;
  utility?: string;
  referenceType?: string;
  referenceId?: string;
  memo?: string;
  fiatAmount?: number;
  fiatCurrency?: string;
  exchangeRate?: number;
  actorUserId?: string;
  businessId?: string;
  metadata?: Record<string, unknown>;
  completedAt?: string;
}): Promise<NxrTransaction> {
  const { data, error } = await db()
    .from("atlas_nxr_transactions")
    .insert({
      tx_number: input.txNumber,
      kind: input.kind,
      status: input.status,
      from_account_id: input.fromAccountId ?? null,
      to_account_id: input.toAccountId ?? null,
      amount: input.amount,
      utility: input.utility ?? null,
      reference_type: input.referenceType ?? null,
      reference_id: input.referenceId ?? null,
      memo: input.memo ?? null,
      fiat_amount: input.fiatAmount ?? null,
      fiat_currency: input.fiatCurrency ?? null,
      exchange_rate: input.exchangeRate ?? null,
      actor_user_id: input.actorUserId ?? null,
      business_id: input.businessId ?? null,
      metadata: input.metadata ?? {},
      completed_at: input.completedAt ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to insert NXR tx");
  return data as NxrTransaction;
}

export async function getExchangeRate(
  quoteCurrency = "USD",
): Promise<number> {
  const { data } = await db()
    .from("atlas_nxr_exchange_rates")
    .select("rate")
    .eq("base_symbol", "NXR")
    .eq("quote_currency", quoteCurrency)
    .maybeSingle();
  return Number((data as { rate?: number } | null)?.rate ?? 0.1);
}

export async function getRewardRuleByCode(
  code: string,
): Promise<NxrRewardRule | null> {
  const { data } = await db()
    .from("atlas_nxr_reward_rules")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  return (data as NxrRewardRule | null) ?? null;
}

export async function insertReward(input: {
  accountId: string;
  ruleId?: string;
  campaignId?: string;
  kind: string;
  amount: number;
  transactionId?: string;
  referenceType?: string;
  referenceId?: string;
}): Promise<{ id: string }> {
  const { data, error } = await db()
    .from("atlas_nxr_rewards")
    .insert({
      account_id: input.accountId,
      rule_id: input.ruleId ?? null,
      campaign_id: input.campaignId ?? null,
      kind: input.kind,
      amount: input.amount,
      transaction_id: input.transactionId ?? null,
      reference_type: input.referenceType ?? null,
      reference_id: input.referenceId ?? null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to insert reward");
  return data as { id: string };
}

export async function insertMintEvent(input: {
  toAccountId: string;
  amount: number;
  reason: string;
  transactionId?: string;
  actorUserId?: string;
}): Promise<void> {
  await db().from("atlas_nxr_mint_events").insert({
    to_account_id: input.toAccountId,
    amount: input.amount,
    reason: input.reason,
    transaction_id: input.transactionId ?? null,
    actor_user_id: input.actorUserId ?? null,
  });
}

export async function insertBurnEvent(input: {
  fromAccountId: string;
  amount: number;
  reason: string;
  transactionId?: string;
  actorUserId?: string;
}): Promise<void> {
  await db().from("atlas_nxr_burn_events").insert({
    from_account_id: input.fromAccountId,
    amount: input.amount,
    reason: input.reason,
    transaction_id: input.transactionId ?? null,
    actor_user_id: input.actorUserId ?? null,
  });
}

export async function bumpCirculatingSupply(delta: number): Promise<void> {
  const config = await getTokenConfig();
  await db()
    .from("atlas_nxr_token_config")
    .update({
      circulating_supply: Number(config.circulating_supply) + delta,
      updated_at: new Date().toISOString(),
    })
    .eq("id", config.id);
}

export async function ensureLoyaltyAccount(input: {
  userId?: string;
  businessId?: string;
  nxrAccountId?: string;
}): Promise<NxrLoyaltyAccount> {
  if (input.userId) {
    const { data } = await db()
      .from("atlas_nxr_loyalty_accounts")
      .select("*")
      .eq("user_id", input.userId)
      .maybeSingle();
    if (data) return data as NxrLoyaltyAccount;
  }
  if (input.businessId) {
    const { data } = await db()
      .from("atlas_nxr_loyalty_accounts")
      .select("*")
      .eq("business_id", input.businessId)
      .maybeSingle();
    if (data) return data as NxrLoyaltyAccount;
  }

  const { data, error } = await db()
    .from("atlas_nxr_loyalty_accounts")
    .insert({
      user_id: input.userId ?? null,
      business_id: input.businessId ?? null,
      nxr_account_id: input.nxrAccountId ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create loyalty");
  return data as NxrLoyaltyAccount;
}

export async function updateLoyalty(input: {
  loyaltyId: string;
  points: number;
  lifetimeEarned: number;
  tier: string;
}): Promise<void> {
  await db()
    .from("atlas_nxr_loyalty_accounts")
    .update({
      points: input.points,
      lifetime_earned: input.lifetimeEarned,
      tier: input.tier,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.loyaltyId);
}

export async function insertTokenPayment(input: {
  payerAccountId: string;
  payeeAccountId?: string;
  amount: number;
  utility: string;
  status: string;
  transactionId?: string;
  referenceType?: string;
  referenceId?: string;
}): Promise<{ id: string }> {
  const { data, error } = await db()
    .from("atlas_nxr_token_payments")
    .insert({
      payer_account_id: input.payerAccountId,
      payee_account_id: input.payeeAccountId ?? null,
      amount: input.amount,
      utility: input.utility,
      status: input.status,
      transaction_id: input.transactionId ?? null,
      reference_type: input.referenceType ?? null,
      reference_id: input.referenceId ?? null,
      completed_at: input.status === "completed" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to record token payment");
  return data as { id: string };
}

export async function insertPremiumActivation(input: {
  accountId: string;
  businessId?: string;
  feature: string;
  amountPaid: number;
  transactionId?: string;
}): Promise<{ id: string }> {
  const { data, error } = await db()
    .from("atlas_nxr_premium_activations")
    .insert({
      account_id: input.accountId,
      business_id: input.businessId ?? null,
      feature: input.feature,
      amount_paid: input.amountPaid,
      transaction_id: input.transactionId ?? null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to activate premium");
  return data as { id: string };
}

export async function upsertBusinessCredits(input: {
  businessId: string;
  creditType: string;
  delta: number;
}): Promise<void> {
  const { data } = await db()
    .from("atlas_nxr_business_credits")
    .select("id, balance")
    .eq("business_id", input.businessId)
    .eq("credit_type", input.creditType)
    .maybeSingle();
  if (data) {
    const row = data as { id: string; balance: number };
    await db()
      .from("atlas_nxr_business_credits")
      .update({
        balance: Number(row.balance) + input.delta,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    return;
  }
  await db().from("atlas_nxr_business_credits").insert({
    business_id: input.businessId,
    credit_type: input.creditType,
    balance: Math.max(0, input.delta),
  });
}

export async function writeNxrAudit(input: {
  action: string;
  accountId?: string;
  transactionId?: string;
  actorUserId?: string;
  businessId?: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await db().from("atlas_nxr_audit_logs").insert({
    action: input.action,
    account_id: input.accountId ?? null,
    transaction_id: input.transactionId ?? null,
    actor_user_id: input.actorUserId ?? null,
    business_id: input.businessId ?? null,
    payload: input.payload ?? {},
  });
}
