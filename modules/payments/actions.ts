"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/modules/users/repository";
import { getExchangeRate, usdToCrypto } from "@/modules/settlement/fee-calculator";
import {
  deriveSessionDepositAddress,
  buildQrPayload,
} from "@/lib/blockchain/deposit";
import { verifyCryptoPayment, findIncomingTxHash } from "@/lib/blockchain/verify-payment";
import { auditLogger } from "@/lib/logging/audit-logger";
import { canCompletePaymentSession } from "@/lib/payments/guards";
import { finalizeCryptoPayment } from "@/lib/payments/finalize-crypto-payment";
import { initiatePaymentSchema, verifyPaymentSchema } from "./validators";
import { getInvoicePaymentOptions } from "./repository";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";
import type { CryptoAsset } from "@/lib/blockchain/bsc-client";
import type { ActionResult } from "@/modules/auth/actions";

export type PaymentActionResult = ActionResult & {
  sessionId?: string;
  clientSecret?: string;
  paymentKind?: "crypto" | "card";
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

  const supabase = createAdminClient();
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", validInvoiceId)
    .single();

  if (invoiceError || !invoice) {
    return { success: false, error: "Invoice not found" };
  }

  if (invoice.customer_id !== profile.id) {
    return { success: false, error: "Invoice access denied" };
  }

  if (!["pending", "draft"].includes(invoice.status)) {
    return { success: false, error: "Invoice is not payable" };
  }

  const paymentOptions = await getInvoicePaymentOptions(invoice.store_id);
  const isCard = validMethod === "card";

  if (isCard && !paymentOptions.acceptsCard) {
    return { success: false, error: "This store does not accept card payments" };
  }

  if (!isCard && !paymentOptions.acceptsCrypto) {
    return { success: false, error: "This store does not accept crypto payments" };
  }

  const sessionId = crypto.randomUUID();

  if (isCard) {
    if (!isStripeConfigured()) {
      return { success: false, error: "Card payments are not configured" };
    }

    const stripe = getStripe();
    const amountCents = Math.round(Number(invoice.amount) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        session_id: sessionId,
        invoice_id: validInvoiceId,
        order_id: invoice.order_id,
        customer_id: profile.id,
      },
    });

    const { error } = await supabase.rpc("create_payment_session", {
      p_session_id: sessionId,
      p_invoice_id: validInvoiceId,
      p_method: "card",
      p_deposit_address: paymentIntent.id,
      p_qr_payload: "",
      p_crypto_amount: Number(invoice.amount),
      p_currency: "USD",
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
        method: "card",
        amount_usd: invoice.amount,
      },
    });

    revalidatePath(`/customer/orders/${invoice.order_id}`);
    return {
      success: true,
      sessionId,
      clientSecret: paymentIntent.client_secret ?? undefined,
      paymentKind: "card",
    };
  }

  const rate = await getExchangeRate(validMethod);
  const cryptoAmount = usdToCrypto(Number(invoice.amount), rate);

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
  return { success: true, sessionId, paymentKind: "crypto" };
}

export async function cancelPaymentSessionAction(
  sessionId: string
): Promise<ActionResult> {
  await requireRole(["customer"]);

  const parsed = verifyPaymentSchema.safeParse({ sessionId });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("cancel_payment_session", {
    p_session_id: parsed.data.sessionId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function verifyPaymentAction(
  sessionId: string
): Promise<PaymentActionResult> {
  const profile = await requireRole(["customer"]);

  const parsed = verifyPaymentSchema.safeParse({ sessionId });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = createAdminClient();
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

  const guard = canCompletePaymentSession({
    status: session.status,
    expiresAt: session.expires_at,
  });
  if (!guard.valid) {
    return { success: false, error: guard.reason };
  }

  const order = session.order as { customer_id?: string } | null;
  const invoice = session.invoice as { customer_id?: string } | null;
  const customerId = order?.customer_id ?? invoice?.customer_id;
  if (customerId !== profile.id) {
    return { success: false, error: "Unauthorized" };
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

  const finalized = await finalizeCryptoPayment({
    sessionId: parsed.data.sessionId,
    txHash,
    verifiedAmount: received,
  });

  if (!finalized.success) {
    return { success: false, error: finalized.error };
  }

  auditLogger.log({
    action: "payment.completed",
    entityType: "payment_session",
    entityId: parsed.data.sessionId,
    actorId: profile.id,
    actorRole: profile.role,
    metadata: {
      order_id: finalized.orderId,
      settlement_id: finalized.settlementId,
      tx_hash: finalized.txHash,
      platform_fee: finalized.platformFee,
      merchant_amount: finalized.merchantAmount,
    },
  });

  revalidatePath(`/customer/orders/${session.order_id}`);
  revalidatePath("/customer/invoices");
  return { success: true, redirectTo: `/customer/orders/${session.order_id}` };
}
