import {
  createWalletClient,
  http,
  parseUnits,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bsc } from "viem/chains";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/config/env";
import { getTokenAddress, type CryptoAsset } from "@/lib/blockchain/bsc-client";
import { deriveSessionDepositAddress } from "@/lib/blockchain/deposit";
import { getExchangeRate } from "./fee-calculator";
import { treasuryLogger } from "@/lib/logging/treasury-logger";
import { notifyAdminAlert } from "@/lib/monitoring/alerts";

const ERC20_TRANSFER = [
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

export async function executeSettlement(params: {
  settlementId: string;
  sessionId: string;
  depositPrivateKey: Hex;
  merchantWallet: `0x${string}`;
  treasuryWallet: `0x${string}`;
  platformFeeUsd: number;
  merchantAmountUsd: number;
  asset: CryptoAsset;
}): Promise<void> {
  const admin = createAdminClient();
  const account = privateKeyToAccount(params.depositPrivateKey);

  const walletClient = createWalletClient({
    account,
    chain: bsc,
    transport: http(process.env.BSC_RPC_URL ?? "https://bsc-dataseed.binance.org"),
  });

  const rate = await getExchangeRate(params.asset);
  const platformFeeCrypto = params.platformFeeUsd / rate;
  const merchantAmountCrypto = params.merchantAmountUsd / rate;

  let feeTxHash: string | undefined;
  let merchantTxHash: string | undefined;

  try {
    if (params.asset === "BNB") {
      const feeWei = parseUnits(platformFeeCrypto.toFixed(8), 18);
      const merchantWei = parseUnits(merchantAmountCrypto.toFixed(8), 18);

      feeTxHash = await walletClient.sendTransaction({
        to: params.treasuryWallet,
        value: feeWei,
      });

      merchantTxHash = await walletClient.sendTransaction({
        to: params.merchantWallet,
        value: merchantWei,
      });
    } else {
      const tokenAddress = getTokenAddress(params.asset)!;
      const feeAmount = parseUnits(platformFeeCrypto.toFixed(8), 18);
      const merchantAmount = parseUnits(merchantAmountCrypto.toFixed(8), 18);

      feeTxHash = await walletClient.writeContract({
        address: tokenAddress,
        abi: ERC20_TRANSFER,
        functionName: "transfer",
        args: [params.treasuryWallet, feeAmount],
      });

      merchantTxHash = await walletClient.writeContract({
        address: tokenAddress,
        abi: ERC20_TRANSFER,
        functionName: "transfer",
        args: [params.merchantWallet, merchantAmount],
      });
    }

    const transferUpdates = [
      {
        transfer_type: "platform_fee" as const,
        to_address: params.treasuryWallet,
        amount: platformFeeCrypto,
        currency: params.asset,
        tx_hash: feeTxHash,
      },
      {
        transfer_type: "merchant_payout" as const,
        to_address: params.merchantWallet,
        amount: merchantAmountCrypto,
        currency: params.asset,
        tx_hash: merchantTxHash,
      },
    ];

    for (const transfer of transferUpdates) {
      const { data: updated } = await admin
        .from("settlement_transfers")
        .update({
          to_address: transfer.to_address,
          amount: transfer.amount,
          currency: transfer.currency,
          tx_hash: transfer.tx_hash,
          status: "submitted",
          completed_at: new Date().toISOString(),
        })
        .eq("settlement_id", params.settlementId)
        .eq("transfer_type", transfer.transfer_type)
        .select("id");

      if (!updated?.length) {
        await admin.from("settlement_transfers").insert({
          settlement_id: params.settlementId,
          ...transfer,
          status: "submitted",
          completed_at: new Date().toISOString(),
        });
      }
    }

    await admin
      .from("settlements")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", params.settlementId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    treasuryLogger.error("Settlement execution failed", {
      settlementId: params.settlementId,
      sessionId: params.sessionId,
      error: message,
    });

    await admin
      .from("settlements")
      .update({ status: "failed" })
      .eq("id", params.settlementId);

    await admin.from("audit_logs").insert({
      action: "settlement.failed",
      entity_type: "settlement",
      entity_id: params.settlementId,
      metadata: { error: message, session_id: params.sessionId },
    });

    await notifyAdminAlert({
      type: "treasury_transfer_failed",
      message: `Settlement ${params.settlementId} failed`,
      metadata: { sessionId: params.sessionId, error: message },
    });

    throw err;
  }
}

export async function getTreasuryWallet(): Promise<`0x${string}` | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("platform_settings")
    .select("treasury_wallet_address")
    .limit(1)
    .single();

  const address = data?.treasury_wallet_address ?? env.TREASURY_WALLET_ADDRESS ?? null;
  return address ? (address as `0x${string}`) : null;
}

export async function retryFailedSettlements(limit = 10): Promise<{
  attempted: number;
  succeeded: number;
  failed: number;
}> {
  const pending = await processPendingSettlements(limit);
  const retried = await retryFailedSettlementsInternal(limit);
  return {
    attempted: pending.attempted + retried.attempted,
    succeeded: pending.succeeded + retried.succeeded,
    failed: pending.failed + retried.failed,
  };
}

export async function processPendingSettlements(limit = 10): Promise<{
  attempted: number;
  succeeded: number;
  failed: number;
}> {
  const admin = createAdminClient();
  const treasury = await getTreasuryWallet();
  if (!treasury) return { attempted: 0, succeeded: 0, failed: 0 };

  const { data: settlements } = await admin
    .from("settlements")
    .select(
      "id, payment_session_id, order_id, platform_fee, merchant_amount, order:orders(merchant_wallet_snapshot)"
    )
    .eq("status", "pending")
    .limit(limit);

  let attempted = 0;
  let succeeded = 0;
  let failed = 0;

  for (const settlement of settlements ?? []) {
    const { data: escrow } = await admin
      .from("escrows")
      .select("status")
      .eq("order_id", settlement.order_id)
      .maybeSingle();

    if (escrow && escrow.status !== "released") continue;

    const { data: session } = await admin
      .from("payment_sessions")
      .select("id, method")
      .eq("id", settlement.payment_session_id)
      .single();

    if (!session || session.method === "card") continue;

    const order = settlement.order as { merchant_wallet_snapshot?: string } | null;
    if (!order?.merchant_wallet_snapshot) continue;

    attempted += 1;
    try {
      const { privateKey } = deriveSessionDepositAddress(session.id);
      await executeSettlement({
        settlementId: settlement.id,
        sessionId: session.id,
        depositPrivateKey: privateKey,
        merchantWallet: order.merchant_wallet_snapshot as `0x${string}`,
        treasuryWallet: treasury,
        platformFeeUsd: Number(settlement.platform_fee),
        merchantAmountUsd: Number(settlement.merchant_amount),
        asset: session.method as CryptoAsset,
      });
      succeeded += 1;
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : String(err);
      await notifyAdminAlert({
        type: "merchant_transfer_failed",
        message: `Pending settlement failed for ${settlement.id}`,
        metadata: { error: message },
      }).catch(() => undefined);
    }
  }

  return { attempted, succeeded, failed };
}

async function retryFailedSettlementsInternal(limit = 10): Promise<{
  attempted: number;
  succeeded: number;
  failed: number;
}> {
  const admin = createAdminClient();
  const treasury = await getTreasuryWallet();

  if (!treasury) {
    return { attempted: 0, succeeded: 0, failed: 0 };
  }

  const { data: settlements } = await admin
    .from("settlements")
    .select(
      "id, payment_session_id, platform_fee, merchant_amount, order:orders(merchant_wallet_snapshot)"
    )
    .eq("status", "failed")
    .limit(limit);

  let attempted = 0;
  let succeeded = 0;
  let failed = 0;

  for (const settlement of settlements ?? []) {
    const { data: session } = await admin
      .from("payment_sessions")
      .select("id, method")
      .eq("id", settlement.payment_session_id)
      .single();

    if (!session || session.method === "card") continue;

    const order = settlement.order as { merchant_wallet_snapshot?: string } | null;
    if (!order?.merchant_wallet_snapshot) {
      failed += 1;
      attempted += 1;
      continue;
    }

    attempted += 1;

    try {
      const { privateKey } = deriveSessionDepositAddress(session.id);
      await executeSettlement({
        settlementId: settlement.id,
        sessionId: session.id,
        depositPrivateKey: privateKey,
        merchantWallet: order.merchant_wallet_snapshot as `0x${string}`,
        treasuryWallet: treasury,
        platformFeeUsd: Number(settlement.platform_fee),
        merchantAmountUsd: Number(settlement.merchant_amount),
        asset: session.method as CryptoAsset,
      });
      succeeded += 1;
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : String(err);
      await notifyAdminAlert({
        type: "merchant_transfer_failed",
        message: `Settlement retry failed for ${settlement.id}`,
        metadata: { error: message },
      }).catch(() => undefined);
    }
  }

  return {
    attempted,
    succeeded,
    failed,
  };
}
