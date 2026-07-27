import { NextResponse } from "next/server";

/**
 * Stripe webhook handler — Phase 4 stub.
 * Configure STRIPE_WEBHOOK_SECRET and implement card payment flow in production.
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 503 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Stripe SDK verification and payment_intent.succeeded handling
  // will be wired in a follow-up when STRIPE_SECRET_KEY is configured.
  console.info("[stripe webhook] received event", body.slice(0, 120));

  return NextResponse.json({ received: true });
}
