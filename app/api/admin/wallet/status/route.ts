export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import { isTreasuryWallet, getTreasuryWalletAddress } from "@/lib/admin/super-admin";
import { authorizeSuperAdminRequest } from "@/lib/admin/authorization";

export async function GET(request: NextRequest) {
  const session = await authorizeSuperAdminRequest(request);
  const walletParam = request.nextUrl.searchParams.get("wallet");

  let isTreasury = false;
  if (walletParam) {
    try {
      isTreasury = await isTreasuryWallet(walletParam);
    } catch {
      isTreasury = false;
    }
  }

  const treasuryConfigured = Boolean(await getTreasuryWalletAddress());

  if (!session) {
    return NextResponse.json({
      authenticated: false,
      isTreasuryWallet: isTreasury,
      treasuryConfigured,
      walletRecognized: walletParam ? isTreasury : undefined,
    });
  }

  return NextResponse.json({
    authenticated: true,
    walletAddress: session.walletAddress,
    expiresAt: session.expiresAt,
    isTreasuryWallet: isTreasury,
    treasuryConfigured,
  });
}
