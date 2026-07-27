import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCryptoPayment, findIncomingTxHash } from "@/lib/blockchain/verify-payment";
import { verifyCronSecret, cronUnauthorizedResponse } from "@/lib/security/cron-auth";
import { paymentLogger } from "@/lib/logging/payment-logger";
import { notifyAdminAlert } from "@/lib/monitoring/alerts";
import type { CryptoAsset } from "@/lib/blockchain/bsc-client";

export async function GET(request: Request) {
  const auth = verifyCronSecret(request);
  if (!auth.authorized) {
    return cronUnauthorizedResponse();
  }

  const admin = createAdminClient();
  const { data: sessions, error } = await admin
    .from("payment_sessions")
    .select("id, deposit_address, amount, method, expires_at")
    .eq("status", "waiting")
    .gt("expires_at", new Date().toISOString())
    .limit(50);

  if (error) {
    paymentLogger.error("Failed to load waiting payment sessions", { error: error.message });
    await notifyAdminAlert({
      type: "database_failure",
      message: "Payment verification cron failed to query sessions",
      metadata: { error: error.message },
    });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  let verified = 0;
  let failures = 0;

  for (const session of sessions ?? []) {
    try {
      const { verified: ok } = await verifyCryptoPayment(
        session.deposit_address as `0x${string}`,
        Number(session.amount),
        session.method as CryptoAsset
      );

      if (!ok) continue;

      const txHash =
        (await findIncomingTxHash(
          session.deposit_address as `0x${string}`,
          session.method as CryptoAsset
        )) ?? `cron-verified-${session.id}`;

      const { error: completeError } = await admin.rpc("complete_payment", {
        p_session_id: session.id,
        p_tx_hash: txHash,
        p_verified_amount: Number(session.amount),
      });

      if (completeError) {
        failures += 1;
        paymentLogger.warn("complete_payment RPC failed", {
          sessionId: session.id,
          error: completeError.message,
        });
        continue;
      }

      verified += 1;
      paymentLogger.info("Payment verified via cron", { sessionId: session.id, txHash });
    } catch (err) {
      failures += 1;
      paymentLogger.error("Payment verification error", {
        sessionId: session.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (failures > 0) {
    await notifyAdminAlert({
      type: "payment_verification_failed",
      message: `${failures} payment verification failure(s) during cron run`,
      metadata: { checked: sessions?.length ?? 0, verified, failures },
    });
  }

  return NextResponse.json({
    checked: sessions?.length ?? 0,
    verified,
    failures,
  });
}
