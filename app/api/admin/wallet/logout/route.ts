export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import {
  clearSuperAdminSessionCookie,
  getSuperAdminSessionFromRequest,
  writeWalletAuditLog,
} from "@/lib/admin/super-admin";
import { getRequestAuditContext } from "@/lib/security/request-context";
import { assertSameOrigin, crossOriginForbiddenResponse } from "@/lib/security/origin-check";

export async function POST(request: NextRequest) {
  if (!assertSameOrigin(request)) return crossOriginForbiddenResponse();

  const context = getRequestAuditContext(request);
  const session = await getSuperAdminSessionFromRequest(request);

  if (session) {
    await writeWalletAuditLog({
      action: "admin.logout",
      entityType: "admin_session",
      walletAddress: session.walletAddress,
      result: "success",
      context,
    });

    await writeWalletAuditLog({
      action: "admin.wallet.disconnected",
      entityType: "admin_session",
      walletAddress: session.walletAddress,
      result: "success",
      context,
    });
  }

  await clearSuperAdminSessionCookie();
  return NextResponse.json({ success: true });
}
