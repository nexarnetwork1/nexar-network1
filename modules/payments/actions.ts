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
import { auditLogger } from "@/lib/logging/audit-logger";
import { initiatePaymentSchema, verifyPaymentSchema } from "./validators";
import type { CryptoAsset } from "@/lib/blockchain/bsc-client";
import type { ActionResult } from "@/modules/auth/actions";

export type PaymentActionResult = ActionResult & {
  sessionId?: string;
};

export async function initiatePaymentAction(
  invoiceId: string,
  method: string
): Promise<PaymentActionResult> {
  const profile = await requireRole(["customer"]);

  const parsed = initiatePaymentSchema.safeParse({ invoiceId, method });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { invoiceId: validInvoiceId, method: validMethod } = parsed.data;

  const supabase = await createClient();
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", validInvoiceId)
    .single();

  if (invoiceError || !invoice) {
    return { success: false, error: "Invoice not found" };
  }

  if (!["pending", "draft"].includes(invoice.status)) {
    return { success: false, error: "Invoice is not payable" };
  }

  const rate = await getExchangeRate(validMethod);
  const cryptoAmount = usdToCrypto(Number(invoice.amount), rate);

  const sessionId = crypto.randomUUID();

  let depositAddress: string;
  let qrPayload: string;

  try {
    const derived = deriveSessionDepositAddress(sessionId);
    depositAddress = derived.address;
    qrPayload = buildQrPayload(depositAddress, cryptoAmount, validMethod as CryptoAsset);
  } catch {
    return { success: false, error: "Payment system not configured" };
  }

  const { error } = await supabase.rpc("create_payment_session", {
    p_session_id: sessionId,
    p_invoice_id: validInvoiceId,
    p_method: validMethod,
    p_deposit_address: depositAddress,
    p_qr_payload: qrPayload,
    p_crypto_amount: cryptoAmount,
    p_currency: validMethod,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  auditLogger.log({
    action: "payment.session.created",
    entityType: "payment_session",
    entityId: sessionId,
    actorId: profile.id,
    actorRole: profile.role,
    metadata: {
      invoice_id: validInvoiceId,
      method: validMethod,
      amount_usd: invoice.amount,
    },
  });

  revalidatePath(`/customer/orders/${invoice.order_id}`);
  return { success: true, sessionId };
}

export async function verifyPaymentAction(
  sessionId: string
): Promise<PaymentActionResult> {
  const profile = await requireRole(["customer"]);

  const parsed = verifyPaymentSchema.safeParse({ sessionId });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data: session, error } = await supabase
    .from("payment_sessions")
    .select("*, invoice:invoices(*), order:orders(*)")
    .eq("id", parsed.data.sessionId)
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
    )) ?? `verified-${parsed.data.sessionId}`;

  const admin = createAdminClient();
  const { data: result, error: completeError } = await admin.rpc(
    "complete_payment",
    {
      p_session_id: parsed.data.sessionId,
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
      const { privateKey } = deriveSessionDepositAddress(parsed.data.sessionId);
      await executeSettlement({
        settlementId: settlement.settlement_id,
        sessionId: parsed.data.sessionId,
        depositPrivateKey: privateKey,
        merchantWallet: order.merchant_wallet_snapshot as `0x${string}`,
        treasuryWallet: treasury,
        platformFeeUsd: settlement.platform_fee,
        merchantAmountUsd: settlement.merchant_amount,
        asset: session.method as CryptoAsset,
      });
    } catch (err) {
      const { captureException } = await import("@/lib/monitoring/sentry");
      await captureException(err, { sessionId: parsed.data.sessionId, phase: "settlement" });
    }
  }

  auditLogger.log({
    action: "payment.completed",
    entityType: "payment_session",
    entityId: parsed.data.sessionId,
    actorId: profile.id,
    actorRole: profile.role,
    metadata: {
      order_id: session.order_id,
      settlement_id: settlement.settlement_id,
      tx_hash: txHash,
      platform_fee: settlement.platform_fee,
      merchant_amount: settlement.merchant_amount,
    },
  });

  revalidatePath(`/customer/orders/${session.order_id}`);
  revalidatePath("/customer/invoices");
  return { success: true, redirectTo: `/customer/orders/${session.order_id}` };
}
