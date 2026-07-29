export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import {
  getSuperAdminSessionFromRequest,
  isTreasuryWallet,
  getTreasuryWalletAddress,
} from "@/lib/admin/super-admin";
import { normalizeWalletAddress } from "@/lib/admin/session";

export async function GET(request: NextRequest) {
  const session = await getSuperAdminSessionFromRequest(request);
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

  const treasury = await getTreasuryWalletAddress();
  const valid =
    treasury &&
    session.walletAddress === normalizeWalletAddress(treasury);

  return NextResponse.json({
    authenticated: Boolean(valid),
    walletAddress: valid ? session.walletAddress : null,
    expiresAt: valid ? session.expiresAt : null,
    isTreasuryWallet: isTreasury,
    treasuryConfigured,
  });
}
