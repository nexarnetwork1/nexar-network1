import { env } from "./env";

export const treasuryConfig = {
  walletAddress: env.NEXT_PUBLIC_TREASURY_WALLET_ADDRESS ?? null,
  privateKeyEnvVar: "TREASURY_WALLET_PRIVATE_KEY",
  hdMnemonicEnvVar: "HD_WALLET_MNEMONIC",
} as const;
