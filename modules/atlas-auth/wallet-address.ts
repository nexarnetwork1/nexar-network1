import { getAddress } from "viem";

/** Canonical lowercase EVM address for storage and uniqueness checks. */
export function normalizeWalletAddress(address: string): string | null {
  const trimmed = address.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return null;
  try {
    return getAddress(trimmed).toLowerCase();
  } catch {
    return null;
  }
}
