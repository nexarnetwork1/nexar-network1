import "server-only";

import { randomBytes } from "node:crypto";
import { getAddress, verifyMessage } from "viem";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeWalletAddress } from "./wallet-address";

export { normalizeWalletAddress } from "./wallet-address";

const NONCE_TTL_MS = 5 * 60 * 1000;
const BSC_CHAIN_ID = 56;

function buildSiweMessage(params: {
  domain: string;
  address: string;
  nonce: string;
  issuedAt: string;
}): string {
  return [
    `${params.domain} wants you to sign in with your Ethereum account:`,
    params.address,
    "",
    "Link this wallet to your ATLAS identity on Nexar Network.",
    "",
    "URI: https://www.nexarnetwork.org",
    "Version: 1",
    "Chain ID: 56",
    `Nonce: ${params.nonce}`,
    `Issued At: ${params.issuedAt}`,
  ].join("\n");
}

export async function createWalletLinkChallenge(
  userId: string,
  walletAddress: string,
  domain: string,
): Promise<{ message: string; nonce: string } | { error: string }> {
  const normalized = normalizeWalletAddress(walletAddress);
  if (!normalized) return { error: "Invalid wallet address." };

  const admin = createAdminClient();

  const { data: taken } = await admin
    .from("wallet_connections")
    .select("user_id")
    .eq("wallet_address", normalized)
    .maybeSingle();

  if (taken && (taken as { user_id: string }).user_id !== userId) {
    return { error: "This wallet is already linked to another ATLAS account." };
  }

  const nonce = randomBytes(16).toString("hex");
  const issuedAt = new Date().toISOString();
  const message = buildSiweMessage({
    domain,
    address: getAddress(normalized),
    nonce,
    issuedAt,
  });

  const { error } = await admin.from("wallet_auth_nonces").insert({
    user_id: userId,
    wallet_address: normalized,
    nonce,
    message,
    expires_at: new Date(Date.now() + NONCE_TTL_MS).toISOString(),
  });

  if (error) return { error: error.message };

  return { message, nonce };
}

export async function verifyWalletLinkSignature(params: {
  userId: string;
  walletAddress: string;
  signature: `0x${string}`;
  message: string;
  provider?: string;
}): Promise<{ ok: true } | { error: string }> {
  const normalized = normalizeWalletAddress(params.walletAddress);
  if (!normalized) return { error: "Invalid wallet address." };

  const admin = createAdminClient();

  const { data: challenge } = await admin
    .from("wallet_auth_nonces")
    .select("id, nonce, expires_at, used_at, user_id")
    .eq("user_id", params.userId)
    .eq("wallet_address", normalized)
    .eq("message", params.message)
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!challenge) return { error: "Wallet verification expired. Request a new challenge." };

  const row = challenge as {
    id: string;
    expires_at: string;
    used_at: string | null;
  };

  if (new Date(row.expires_at) < new Date()) {
    return { error: "Wallet verification expired. Request a new challenge." };
  }

  const valid = await verifyMessage({
    address: getAddress(normalized),
    message: params.message,
    signature: params.signature,
  });

  if (!valid) return { error: "Wallet signature verification failed." };

  await admin
    .from("wallet_auth_nonces")
    .update({ used_at: new Date().toISOString() })
    .eq("id", row.id);

  const verifiedAt = new Date().toISOString();

  const { data: existing } = await admin
    .from("wallet_connections")
    .select("id")
    .eq("user_id", params.userId)
    .maybeSingle();

  if (existing) {
    const { error: updateError } = await admin
      .from("wallet_connections")
      .update({
        wallet_address: normalized,
        chain_id: BSC_CHAIN_ID,
        provider: params.provider ?? null,
        is_verified: true,
        verified_at: verifiedAt,
        updated_at: verifiedAt,
      })
      .eq("user_id", params.userId);
    if (updateError) return { error: updateError.message };
  } else {
    const { error: insertError } = await admin.from("wallet_connections").insert({
      user_id: params.userId,
      wallet_address: normalized,
      chain_id: BSC_CHAIN_ID,
      provider: params.provider ?? null,
      is_verified: true,
      verified_at: verifiedAt,
    });
    if (insertError) return { error: insertError.message };
  }

  await admin
    .from("profiles")
    .update({ wallet_address: normalized, updated_at: verifiedAt })
    .eq("id", params.userId);

  await admin.from("security_events").insert({
    user_id: params.userId,
    event_type: "wallet.linked",
    metadata: { chainId: BSC_CHAIN_ID, provider: params.provider ?? "unknown" },
  });

  return { ok: true };
}

export async function disconnectWallet(userId: string): Promise<{ ok: true } | { error: string }> {
  const admin = createAdminClient();
  await admin.from("wallet_connections").delete().eq("user_id", userId);
  await admin
    .from("profiles")
    .update({ wallet_address: null, updated_at: new Date().toISOString() })
    .eq("id", userId);

  await admin.from("security_events").insert({
    user_id: userId,
    event_type: "wallet.disconnected",
    metadata: {},
  });

  return { ok: true };
}

export async function getWalletConnection(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("wallet_connections")
    .select("id, user_id, wallet_address, chain_id, provider, is_verified, verified_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;

  const row = data as {
    id: string;
    user_id: string;
    wallet_address: string;
    chain_id: number;
    provider: string | null;
    is_verified: boolean;
    verified_at: string | null;
  };

  return {
    id: row.id,
    userId: row.user_id,
    walletAddress: row.wallet_address,
    chainId: row.chain_id,
    provider: row.provider,
    isVerified: row.is_verified,
    verifiedAt: row.verified_at,
  };
}
