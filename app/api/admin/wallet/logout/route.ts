import { NextResponse, type NextRequest } from "next/server";
import {
  clearSuperAdminSessionCookie,
  getSuperAdminSessionFromRequest,
  writeWalletAuditLog,
} from "@/lib/admin/super-admin";
import { getRequestAuditContext } from "@/lib/security/request-context";

export async function POST(request: NextRequest) {
  const context = getRequestAuditContext(request);
  const session = getSuperAdminSessionFromRequest(request);

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
