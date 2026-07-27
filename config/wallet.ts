import { env } from "./env";

export const walletConfig = {
  addressPattern: /^0x[a-fA-F0-9]{40}$/,
  defaultChainId: 56,
  supportedChainIds: [56] as const,
  rpcUrl:
    env.NEXT_PUBLIC_BSC_RPC_URL ?? "https://bsc-dataseed.binance.org",
} as const;
