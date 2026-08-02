export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { walletConfig } from "@/config/wallet";
import { writeWalletAuditLog } from "@/lib/admin/super-admin";
import { getRequestAuditContext } from "@/lib/security/request-context";
import { assertSameOrigin, crossOriginForbiddenResponse } from "@/lib/security/origin-check";

const bodySchema = z.object({
  walletAddress: z.string().regex(walletConfig.addressPattern),
});

export async function POST(request: NextRequest) {
  if (!assertSameOrigin(request)) return crossOriginForbiddenResponse();

  const context = getRequestAuditContext(request);

  try {
    const body = bodySchema.parse(await request.json());
    await writeWalletAuditLog({
      action: "admin.wallet.connected",
      entityType: "wallet",
      walletAddress: body.walletAddress,
      result: "success",
      context,
    });
    return NextResponse.json({ logged: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
