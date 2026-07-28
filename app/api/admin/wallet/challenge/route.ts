export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { walletConfig } from "@/config/wallet";
import { createWalletChallenge, writeWalletAuditLog } from "@/lib/admin/super-admin";
import { getRequestAuditContext } from "@/lib/security/request-context";

const bodySchema = z.object({
  walletAddress: z.string().regex(walletConfig.addressPattern),
});

export async function POST(request: Request) {
  const context = getRequestAuditContext(request);

  try {
    const body = bodySchema.parse(await request.json());
    const challenge = await createWalletChallenge(body.walletAddress);

    await writeWalletAuditLog({
      action: "admin.wallet.challenge_created",
      entityType: "admin_wallet_challenge",
      entityId: challenge.challengeId,
      walletAddress: body.walletAddress,
      result: "success",
      context,
    });

    return NextResponse.json(challenge);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
