/**
 * @deprecated Wallet Super Admin removed in Phase 12.
 * Re-exports HQ authorization for transitional imports only.
 */

export {
  requireHqAccess as requireSuperAdminSession,
  getHqSession as getSuperAdminSession,
  hasHqAuthority,
  requireHqAccess,
  getHqSession,
} from "@/lib/hq/authorization";

/** No-op — wallet admin cookies no longer exist. */
export async function clearSuperAdminSessionCookie(): Promise<void> {
  /* removed */
}

/** Always null — wallet Super Admin sessions abolished. */
export async function getSuperAdminSessionFromRequest(): Promise<null> {
  return null;
}

export async function isCurrentTreasurySession(): Promise<boolean> {
  return false;
}

export async function getTreasuryWalletAddress(): Promise<string | null> {
  return (
    process.env.TREASURY_WALLET_ADDRESS ??
    process.env.NEXT_PUBLIC_TREASURY_WALLET_ADDRESS ??
    null
  );
}

export async function isTreasuryWallet(_address: string): Promise<boolean> {
  return false;
}
