import { keccak256, toBytes, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { CryptoAsset } from "./bsc-client";

/**
 * Deterministically derives a deposit address per payment session from the
 * platform master seed. Private key never leaves the server.
 */
export function deriveSessionDepositAddress(sessionId: string): {
  address: `0x${string}`;
  privateKey: Hex;
} {
  const masterSeed = process.env.PAYMENT_MASTER_SEED;
  if (!masterSeed) {
    throw new Error("PAYMENT_MASTER_SEED is not configured");
  }

  const privateKey = keccak256(
    toBytes(`${masterSeed}:${sessionId}`)
  ) as Hex;

  const account = privateKeyToAccount(privateKey);
  return { address: account.address, privateKey };
}

export function buildQrPayload(
  address: string,
  amount: number,
  asset: CryptoAsset
): string {
  if (asset === "BNB") {
    return `bnb:${address}?amount=${amount}`;
  }
  const tokenAddress =
    asset === "USDT"
      ? process.env.USDT_TOKEN_ADDRESS ?? "0x55d398326f99059fF775485246099027B3197955"
      : process.env.NXR_TOKEN_ADDRESS ?? "0x3c7c9eeA8826e5bcB4ed2b798123915Cd596c909";

  return `ethereum:${tokenAddress}/transfer?address=${address}&uint256=${amount}`;
}

export function getAssetDecimals(asset: CryptoAsset): number {
  return asset === "BNB" ? 18 : 18;
}
