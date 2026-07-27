import { NextResponse } from "next/server";
import { logger } from "@/lib/logging/logger";
import { securityLogger } from "@/lib/logging/security-logger";

/**
 * Stripe webhook handler — card payment flow stub.
 * Wire Stripe SDK verification when STRIPE_SECRET_KEY is configured.
 */
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

  logger.info("[stripe webhook] event received", {
    bodyLength: body.length,
  });

  // TODO: verify signature with Stripe SDK and handle payment_intent.succeeded
  return NextResponse.json({ received: true });
}
