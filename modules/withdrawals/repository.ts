import { createAdminClient } from "@/lib/supabase/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getHeldEscrowBalance } from "@/modules/escrow/repository";
import type { WithdrawalRequest, WithdrawalStatus } from "@/types";

export async function getMerchantWithdrawals(merchantId: string): Promise<WithdrawalRequest[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("withdrawal_requests")
    .select("*")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false });
  return (data ?? []) as WithdrawalRequest[];
}

export async function getPendingWithdrawals(): Promise<WithdrawalRequest[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("withdrawal_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  return (data ?? []) as WithdrawalRequest[];
}

export async function createWithdrawalRequest(params: {
  merchantId: string;
  storeId: string;
  amount: number;
  currency: string;
  walletAddress: string;
  chainId?: number;
}): Promise<{ id?: string; error?: string }> {
  const held = await getHeldEscrowBalance(params.storeId);
  if (held > 0) {
    return { error: "Withdrawals blocked while escrow funds are held" };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("withdrawal_requests")
    .insert({
      merchant_id: params.merchantId,
      store_id: params.storeId,
      amount: params.amount,
      currency: params.currency,
      wallet_address: params.walletAddress,
      chain_id: params.chainId ?? 56,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}

export async function reviewWithdrawal(params: {
  withdrawalId: string;
  reviewerId: string;
  status: Extract<WithdrawalStatus, "approved" | "rejected" | "processing" | "completed">;
  rejectionReason?: string;
  txHash?: string;
}): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("withdrawal_requests")
    .update({
      status: params.status,
      reviewed_by: params.reviewerId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: params.rejectionReason ?? null,
      tx_hash: params.txHash ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.withdrawalId);
  return !error;
}
