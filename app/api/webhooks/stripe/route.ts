import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import { logger } from "@/lib/logging/logger";
import { securityLogger } from "@/lib/logging/security-logger";
import { notifyPaymentCompleted } from "@/modules/payments/notify";
import { auditLogger } from "@/lib/logging/audit-logger";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    securityLogger.log({
      event: "suspicious_input",
      path: "/api/webhooks/stripe",
      metadata: { reason: "missing_stripe_signature" },
    });
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await request.text();

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    securityLogger.log({
      event: "suspicious_input",
      path: "/api/webhooks/stripe",
      metadata: { reason: message },
    });
    return NextResponse.json({ error: message }, { status: 400 });
  }

  logger.info("[stripe webhook] event received", { type: event.type });

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const sessionId = paymentIntent.metadata?.session_id;
    const orderId = paymentIntent.metadata?.order_id;

    if (!sessionId) {
      logger.warn("[stripe webhook] missing session_id in metadata");
      return NextResponse.json({ received: true });
    }

    const admin = createAdminClient();
    const { data: result, error } = await admin.rpc("complete_payment", {
      p_session_id: sessionId,
      p_tx_hash: paymentIntent.id,
      p_verified_amount: paymentIntent.amount / 100,
    });

    if (error) {
      logger.error("[stripe webhook] complete_payment failed", { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const settlement = result as {
      merchant_amount?: number;
    };

    auditLogger.log({
      action: "payment.completed",
      entityType: "payment_session",
      entityId: sessionId,
      metadata: {
        order_id: orderId,
        tx_hash: paymentIntent.id,
        method: "card",
        platform_fee: (result as { platform_fee?: number }).platform_fee,
      },
    });

    if (orderId) {
      await notifyPaymentCompleted({
        sessionId,
        orderId,
        amountUsd: paymentIntent.amount / 100,
        merchantAmount: settlement.merchant_amount,
      });
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    securityLogger.log({
      event: "suspicious_input",
      path: "/api/webhooks/stripe",
      metadata: {
        reason: "payment_intent_failed",
        payment_intent: event.data.object.id,
      },
    });
  }

  return NextResponse.json({ received: true });
}
