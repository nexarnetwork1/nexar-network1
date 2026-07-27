import { createHmac, timingSafeEqual } from "crypto";
import { getAddress, type Address } from "viem";
import { env } from "@/config/env";

export const SUPER_ADMIN_COOKIE = "nxr_super_admin";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export type SuperAdminSession = {
  walletAddress: Address;
  expiresAt: number;
};

function sessionSecret(): string {
  if (env.CRON_SECRET) return env.CRON_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("CRON_SECRET is required for super admin sessions in production");
  }
  return "dev-only-secret";
}

export function normalizeWalletAddress(address: string): Address {
  return getAddress(address);
}

export function createSuperAdminSessionToken(walletAddress: string): string {
  const normalized = normalizeWalletAddress(walletAddress);
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${normalized}:${expiresAt}`;
  const signature = createHmac("sha256", sessionSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export function parseSuperAdminSessionToken(token: string | undefined | null): SuperAdminSession | null {
  if (!token) return null;

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon <= 0) return null;

    const signature = decoded.slice(lastColon + 1);
    const payload = decoded.slice(0, lastColon);
    const sep = payload.lastIndexOf(":");
    if (sep <= 0) return null;

    const walletAddress = payload.slice(0, sep) as Address;
    const expiresAt = Number(payload.slice(sep + 1));
    if (!Number.isFinite(expiresAt)) return null;

    const expected = createHmac("sha256", sessionSecret()).update(payload).digest("hex");
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    if (expiresAt < Date.now()) return null;

    return { walletAddress: normalizeWalletAddress(walletAddress), expiresAt };
  } catch {
    return null;
  }
}

export function superAdminCookieOptions(expiresAt: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: new Date(expiresAt),
  };
}

export function buildAdminSignMessage(nonce: string): string {
  return [
    "Nexar Network Super Admin Authentication",
    "",
    `Nonce: ${nonce}`,
    `Issued: ${new Date().toISOString()}`,
    "",
    "Sign this message to verify wallet ownership. This will not trigger a blockchain transaction.",
  ].join("\n");
}
