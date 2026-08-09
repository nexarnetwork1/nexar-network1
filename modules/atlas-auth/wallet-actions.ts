"use server";

import { auth } from "@/auth";
import { headers } from "next/headers";
import type { AtlasAuthActionResult } from "./types";
import {
  createWalletLinkChallenge,
  disconnectWallet,
  getWalletConnection,
  normalizeWalletAddress,
  verifyWalletLinkSignature,
} from "./wallet";

async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new Error("Not authenticated");
  return id;
}

function resolveHost(): string {
  return process.env.AUTH_URL?.replace(/^https?:\/\//, "") ?? "localhost:3000";
}

export async function requestWalletLinkChallengeAction(
  walletAddress: string,
): Promise<{ success: true; message: string } | { success: false; error: string }> {
  try {
    const userId = await requireUserId();
    const normalized = normalizeWalletAddress(walletAddress);
    if (!normalized) return { success: false, error: "Invalid wallet address." };

    const result = await createWalletLinkChallenge(userId, normalized, resolveHost());
    if ("error" in result) return { success: false, error: result.error };

    return { success: true, message: result.message };
  } catch {
    return { success: false, error: "Sign in to connect a wallet." };
  }
}

export async function verifyWalletLinkAction(input: {
  walletAddress: string;
  signature: string;
  message: string;
  provider?: string;
}): Promise<AtlasAuthActionResult> {
  try {
    const userId = await requireUserId();
    const result = await verifyWalletLinkSignature({
      userId,
      walletAddress: input.walletAddress,
      signature: input.signature as `0x${string}`,
      message: input.message,
      provider: input.provider,
    });

    if ("error" in result) return { success: false, error: result.error };
    return { success: true, redirectTo: "/atlas/profile" };
  } catch {
    return { success: false, error: "Sign in to connect a wallet." };
  }
}

export async function disconnectWalletAction(): Promise<AtlasAuthActionResult> {
  try {
    const userId = await requireUserId();
    const result = await disconnectWallet(userId);
    if ("error" in result) return { success: false, error: result.error };
    return { success: true };
  } catch {
    return { success: false, error: "Not authenticated." };
  }
}

export async function getWalletConnectionAction() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return getWalletConnection(session.user.id);
}

/** No-op guard for CSRF-sensitive wallet routes — host header available for SIWE domain. */
export async function getWalletAuthContextAction() {
  const h = await headers();
  return { host: h.get("host") ?? resolveHost() };
}
