import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { verifyMessage } from "viem";
import { CONTRACTS } from "@/lib/constants/site";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import {
  SUPER_ADMIN_COOKIE,
  buildAdminSignMessage,
  createSuperAdminSessionToken,
  normalizeWalletAddress,
  parseSuperAdminSessionToken,
  superAdminCookieOptions,
  type SuperAdminSession,
} from "@/lib/admin/session";
import type { RequestAuditContext } from "@/lib/security/request-context";
export { getSuperAdminSessionFromRequest } from "@/lib/admin/session";

export async function getTreasuryWalletAddress(): Promise<string | null> {
  const envTreasury =
    process.env.TREASURY_WALLET_ADDRESS ??
    process.env.NEXT_PUBLIC_TREASURY_WALLET_ADDRESS ??
    CONTRACTS.treasury;

  const admin = tryCreateAdminClient();
  if (!admin) return envTreasury;

  try {
    const { data } = await admin
      .from("platform_settings")
      .select("treasury_wallet_address")
      .limit(1)
      .maybeSingle();

    return data?.treasury_wallet_address ?? envTreasury;
  } catch {
    return envTreasury;
  }
}

export async function isTreasuryWallet(address: string): Promise<boolean> {
  const treasury = await getTreasuryWalletAddress();
  if (!treasury) return false;
  try {
    return normalizeWalletAddress(address) === normalizeWalletAddress(treasury);
  } catch {
    return false;
  }
}

export async function getSuperAdminSession(): Promise<SuperAdminSession | null> {
  const cookieStore = await cookies();
  const session = await parseSuperAdminSessionToken(cookieStore.get(SUPER_ADMIN_COOKIE)?.value);
  if (!session) return null;

  const treasury = await getTreasuryWalletAddress();
  if (!treasury) return null;

  try {
    if (session.walletAddress !== normalizeWalletAddress(treasury)) {
      return null;
    }
  } catch {
    return null;
  }

  return session;
}

export async function requireSuperAdminSession(): Promise<SuperAdminSession> {
  const session = await getSuperAdminSession();
  if (!session) {
    throw new Error("Super admin wallet session required");
  }
  return session;
}

export async function setSuperAdminSessionCookie(walletAddress: string): Promise<SuperAdminSession> {
  const token = await createSuperAdminSessionToken(walletAddress);
  const session = await parseSuperAdminSessionToken(token);
  if (!session) throw new Error("Failed to create session");

  const cookieStore = await cookies();
  cookieStore.set(SUPER_ADMIN_COOKIE, token, superAdminCookieOptions(session.expiresAt));
  return session;
}

export async function clearSuperAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SUPER_ADMIN_COOKIE);
}

export async function createWalletChallenge(walletAddress: string): Promise<{
  challengeId: string;
  message: string;
  expiresAt: string;
}> {
  const normalized = normalizeWalletAddress(walletAddress);
  const nonce = crypto.randomUUID();
  const message = buildAdminSignMessage(nonce);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const admin = tryCreateAdminClient();
  if (!admin) {
    throw new Error("Admin database not configured");
  }

  const { data, error } = await admin
    .from("admin_wallet_challenges")
    .insert({
      wallet_address: normalized,
      nonce,
      message,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("Failed to create wallet challenge");
  }

  return { challengeId: data.id, message, expiresAt };
}

export async function verifyWalletChallenge(params: {
  challengeId: string;
  walletAddress: string;
  signature: `0x${string}`;
}): Promise<{ verified: boolean; reason?: string }> {
  const normalized = normalizeWalletAddress(params.walletAddress);
  const admin = tryCreateAdminClient();
  if (!admin) return { verified: false, reason: "Admin database not configured" };

  const { data: challenge } = await admin
    .from("admin_wallet_challenges")
    .select("*")
    .eq("id", params.challengeId)
    .maybeSingle();

  if (!challenge) return { verified: false, reason: "Challenge not found" };
  if (challenge.used_at) return { verified: false, reason: "Challenge already used" };
  if (new Date(challenge.expires_at).getTime() < Date.now()) {
    return { verified: false, reason: "Challenge expired" };
  }

  try {
    if (normalizeWalletAddress(challenge.wallet_address) !== normalized) {
      return { verified: false, reason: "Wallet mismatch" };
    }
  } catch {
    return { verified: false, reason: "Invalid wallet address" };
  }

  const valid = await verifyMessage({
    address: normalized,
    message: challenge.message,
    signature: params.signature,
  });

  if (!valid) return { verified: false, reason: "Invalid signature" };

  const treasuryMatch = await isTreasuryWallet(normalized);
  if (!treasuryMatch) return { verified: false, reason: "Wallet is not authorized" };

  await admin
    .from("admin_wallet_challenges")
    .update({ used_at: new Date().toISOString() })
    .eq("id", params.challengeId);

  return { verified: true };
}

export async function writeWalletAuditLog(params: {
  action: string;
  entityType: string;
  entityId?: string;
  walletAddress: string;
  result: "success" | "failure";
  context?: RequestAuditContext;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { writeAuditLog } = await import("@/modules/audit/repository");

  await writeAuditLog({
    actorId: null,
    actorRole: "admin",
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    metadata: {
      wallet_address: normalizeWalletAddress(params.walletAddress),
      result: params.result,
      ...(params.metadata ?? {}),
    },
    context: params.context,
  });
}
