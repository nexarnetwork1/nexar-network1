import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCryptoPayment, findIncomingTxHash } from "@/lib/blockchain/verify-payment";
import type { CryptoAsset } from "@/lib/blockchain/bsc-client";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: sessions, error } = await admin
    .from("payment_sessions")
    .select("id, deposit_address, amount, method, expires_at")
    .eq("status", "waiting")
    .gt("expires_at", new Date().toISOString())
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let verified = 0;

  for (const session of sessions ?? []) {
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

    if (!completeError) verified += 1;
  }

  return NextResponse.json({
    checked: sessions?.length ?? 0,
    verified,
  });
}
