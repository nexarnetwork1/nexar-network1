import { env } from "./env";
import { walletConfig } from "./wallet";

export const blockchainConfig = {
  chainId: walletConfig.defaultChainId,
  chainName: "BNB Smart Chain",
  rpcUrl: walletConfig.rpcUrl,
  tokens: {
    nxr: env.NEXT_PUBLIC_NXR_TOKEN_ADDRESS ?? null,
    usdt: env.NEXT_PUBLIC_USDT_TOKEN_ADDRESS ?? null,
  },
  confirmations: {
    development: 1,
    staging: 3,
    production: 12,
  },
  explorerUrl: "https://bscscan.com",
} as const;
