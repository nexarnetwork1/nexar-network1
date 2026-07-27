"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/modules/users/repository";
import { getExchangeRate, usdToCrypto } from "@/modules/settlement/fee-calculator";
import {
  deriveSessionDepositAddress,
  buildQrPayload,
} from "@/lib/blockchain/deposit";
import { verifyCryptoPayment, findIncomingTxHash } from "@/lib/blockchain/verify-payment";
import {
  executeSettlement,
  getTreasuryWallet,
} from "@/modules/settlement/worker";
import { getOrderById } from "@/modules/orders/repository";
import type { CryptoAsset } from "@/lib/blockchain/bsc-client";
import type { ActionResult } from "@/modules/auth/actions";

export type PaymentActionResult = ActionResult & {
  sessionId?: string;
};

export async function initiatePaymentAction(
  invoiceId: string,
  method: string
): Promise<PaymentActionResult> {
  await requireRole(["customer"]);

  const validMethods = ["NXR", "BNB", "USDT"];
  if (!validMethods.includes(method)) {
    return { success: false, error: "Invalid payment method" };
  }

  const supabase = await createClient();
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();

  if (invoiceError || !invoice) {
    return { success: false, error: "Invoice not found" };
  }

  if (!["pending", "draft"].includes(invoice.status)) {
    return { success: false, error: "Invoice is not payable" };
  }

  const rate = await getExchangeRate(method);
  const cryptoAmount = usdToCrypto(Number(invoice.amount), rate);

  const sessionId = crypto.randomUUID();

  let depositAddress: string;
  let qrPayload: string;

  try {
    const derived = deriveSessionDepositAddress(sessionId);
    depositAddress = derived.address;
    qrPayload = buildQrPayload(depositAddress, cryptoAmount, method as CryptoAsset);
  } catch {
    return { success: false, error: "Payment system not configured" };
  }

  const { data, error } = await supabase.rpc("create_payment_session", {
    p_session_id: sessionId,
    p_invoice_id: invoiceId,
    p_method: method,
    p_deposit_address: depositAddress,
    p_qr_payload: qrPayload,
    p_crypto_amount: cryptoAmount,
    p_currency: method,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/customer/orders/${invoice.order_id}`);
  return { success: true, sessionId };
}

export async function verifyPaymentAction(
  sessionId: string
): Promise<PaymentActionResult> {
  await requireRole(["customer"]);

  const supabase = await createClient();
  const { data: session, error } = await supabase
    .from("payment_sessions")
    .select("*, invoice:invoices(*), order:orders(*)")
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    return { success: false, error: "Session not found" };
  }

  if (session.status === "paid") {
    return { success: true, redirectTo: `/customer/orders/${session.order_id}` };
  }

  if (session.status !== "waiting") {
    return { success: false, error: `Payment ${session.status}` };
  }

  if (new Date(session.expires_at) < new Date()) {
    return { success: false, error: "Payment expired" };
  }

  const { verified, received } = await verifyCryptoPayment(
    session.deposit_address as `0x${string}`,
    Number(session.amount),
    session.method as CryptoAsset
  );

  if (!verified) {
    return { success: false, error: "Payment not yet received" };
  }

  const txHash =
    (await findIncomingTxHash(
      session.deposit_address as `0x${string}`,
      session.method as CryptoAsset
    )) ?? `verified-${sessionId}`;

  const admin = createAdminClient();
  const { data: result, error: completeError } = await admin.rpc(
    "complete_payment",
    {
      p_session_id: sessionId,
      p_tx_hash: txHash,
      p_verified_amount: received,
    }
  );

  if (completeError) {
    return { success: false, error: completeError.message };
  }

  const settlement = result as {
    settlement_id: string;
    platform_fee: number;
    merchant_amount: number;
  };

  const order = await getOrderById(session.order_id);
  const treasury = await getTreasuryWallet();

  if (order && treasury && order.merchant_wallet_snapshot) {
    try {
      const { privateKey } = deriveSessionDepositAddress(sessionId);
      await executeSettlement({
        settlementId: settlement.settlement_id,
        sessionId,
        depositPrivateKey: privateKey,
        merchantWallet: order.merchant_wallet_snapshot as `0x${string}`,
        treasuryWallet: treasury,
        platformFeeUsd: settlement.platform_fee,
        merchantAmountUsd: settlement.merchant_amount,
        asset: session.method as CryptoAsset,
      });
    } catch (err) {
      const { captureException } = await import("@/lib/monitoring/sentry");
      await captureException(err, { sessionId, phase: "settlement" });
    }
  }

  revalidatePath(`/customer/orders/${session.order_id}`);
  revalidatePath("/customer/invoices");
  return { success: true, redirectTo: `/customer/orders/${session.order_id}` };
}
