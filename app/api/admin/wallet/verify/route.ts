export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { walletConfig } from "@/config/wallet";
import {
  setSuperAdminSessionCookie,
  verifyWalletChallenge,
  writeWalletAuditLog,
} from "@/lib/admin/super-admin";
import { getRequestAuditContext } from "@/lib/security/request-context";

const bodySchema = z.object({
  challengeId: z.string().uuid(),
  walletAddress: z.string().regex(walletConfig.addressPattern),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
});

export async function POST(request: Request) {
  const context = getRequestAuditContext(request);

  try {
    const body = bodySchema.parse(await request.json());
    const result = await verifyWalletChallenge({
      challengeId: body.challengeId,
      walletAddress: body.walletAddress,
      signature: body.signature as `0x${string}`,
    });

    if (!result.verified) {
      await writeWalletAuditLog({
        action: "admin.wallet.signature_verified",
        entityType: "admin_session",
        walletAddress: body.walletAddress,
        result: "failure",
        context,
        metadata: { reason: result.reason },
      });

      return NextResponse.json({ error: result.reason ?? "Unauthorized" }, { status: 403 });
    }

    const session = await setSuperAdminSessionCookie(body.walletAddress);

    await writeWalletAuditLog({
      action: "admin.wallet.signature_verified",
      entityType: "admin_session",
      walletAddress: body.walletAddress,
      result: "success",
      context,
    });

    await writeWalletAuditLog({
      action: "admin.login",
      entityType: "admin_session",
      walletAddress: body.walletAddress,
      result: "success",
      context,
      metadata: { expires_at: new Date(session.expiresAt).toISOString() },
    });

    return NextResponse.json({
      success: true,
      walletAddress: session.walletAddress,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
