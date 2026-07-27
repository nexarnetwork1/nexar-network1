import {
  createWalletClient,
  http,
  parseUnits,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bsc } from "viem/chains";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTokenAddress, type CryptoAsset } from "@/lib/blockchain/bsc-client";
import { getExchangeRate } from "./fee-calculator";

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

    await admin.from("settlement_transfers").insert([
      {
        settlement_id: params.settlementId,
        transfer_type: "platform_fee",
        to_address: params.treasuryWallet,
        amount: platformFeeCrypto,
        currency: params.asset,
        tx_hash: feeTxHash,
        status: "submitted",
        completed_at: new Date().toISOString(),
      },
      {
        settlement_id: params.settlementId,
        transfer_type: "merchant_payout",
        to_address: params.merchantWallet,
        amount: merchantAmountCrypto,
        currency: params.asset,
        tx_hash: merchantTxHash,
        status: "submitted",
        completed_at: new Date().toISOString(),
      },
    ]);

    await admin
      .from("settlements")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", params.settlementId);
  } catch (err) {
    await admin
      .from("settlements")
      .update({ status: "failed" })
      .eq("id", params.settlementId);

    await admin.from("audit_logs").insert({
      action: "settlement.failed",
      entity_type: "settlement",
      entity_id: params.settlementId,
      metadata: { error: String(err), session_id: params.sessionId },
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

  const address = data?.treasury_wallet_address ?? process.env.TREASURY_WALLET_ADDRESS;
  return address ? (address as `0x${string}`) : null;
}
