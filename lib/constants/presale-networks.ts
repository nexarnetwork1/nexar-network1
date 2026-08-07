import { bsc } from "wagmi/chains";
import { defineChain } from "viem";

/** BOT Chain mainnet — EVM L1 (chainId 677). */
export const botChain = defineChain({
  id: 677,
  name: "BOT Chain",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_BOT_RPC_URL ?? "https://rpc.botchain.ai"],
    },
  },
  blockExplorers: {
    default: {
      name: "BOT Scan",
      url: "https://scan.botchain.ai",
    },
  },
});

export type PresaleNetworkId = "bsc" | "bot";

export type PresaleNetworkConfig = {
  id: PresaleNetworkId;
  name: string;
  shortName: string;
  chainId: number;
  nativeSymbol: string;
  rpcUrl: string;
  explorerUrl: string;
  explorerName: string;
  /** Official BOT Chain explorer coin page — configure when listed. */
  partnerExplorerCoinUrl?: string;
  icon: string;
  contracts: {
    token: `0x${string}`;
    presale: `0x${string}`;
  };
  wagmiChain: typeof bsc | typeof botChain;
};

export const BOT_CHAIN_EXPLORER_COIN_URL =
  process.env.NEXT_PUBLIC_BOT_EXPLORER_COIN_URL ??
  "https://scan.botchain.ai";

export const PRESALE_NETWORKS: Record<PresaleNetworkId, PresaleNetworkConfig> = {
  bsc: {
    id: "bsc",
    name: "BNB Smart Chain",
    shortName: "BSC",
    chainId: bsc.id,
    nativeSymbol: "BNB",
    rpcUrl:
      process.env.NEXT_PUBLIC_BSC_RPC_URL ?? "https://bsc-dataseed.binance.org",
    explorerUrl: "https://bscscan.com",
    explorerName: "BscScan",
    icon: "/payments/bnb.png",
    contracts: {
      token: "0xc37c9eeAB826e5bcB4ed2b798123915Cd596c909",
      presale: "0x9B3674dfE84b908B88BAf7285c8744531d678c9c",
    },
    wagmiChain: bsc,
  },
  bot: {
    id: "bot",
    name: "BOT Chain",
    shortName: "BOT",
    chainId: botChain.id,
    nativeSymbol: "BOT",
    rpcUrl: process.env.NEXT_PUBLIC_BOT_RPC_URL ?? "https://rpc.botchain.ai",
    explorerUrl: "https://scan.botchain.ai",
    explorerName: "BOT Scan",
    partnerExplorerCoinUrl: BOT_CHAIN_EXPLORER_COIN_URL,
    icon: "/partners/botchain-logo.png",
    contracts: {
      token: "0xC5eF46f94678b1606da0EB488fAafc420f05F6A2",
      presale: "0x69310ca8088D1bBE9c8641F9Bf62aa0FeCe53f41",
    },
    wagmiChain: botChain,
  },
};

export const DEFAULT_PRESALE_NETWORK_ID: PresaleNetworkId = "bsc";

export const PRESALE_NETWORK_LIST = Object.values(PRESALE_NETWORKS);

export function getPresaleNetwork(id: PresaleNetworkId = DEFAULT_PRESALE_NETWORK_ID) {
  return PRESALE_NETWORKS[id];
}

/** Resolve presale network from an EVM chain id (BSC or BOT). */
export function getPresaleNetworkByChainId(chainId: number): PresaleNetworkConfig | null {
  for (const network of PRESALE_NETWORK_LIST) {
    if (network.chainId === chainId) return network;
  }
  return null;
}

export function getExplorerAddressUrl(
  network: PresaleNetworkConfig,
  address: string,
): string {
  return `${network.explorerUrl}/address/${address}`;
}

export function getExplorerTxUrl(
  network: PresaleNetworkConfig,
  txHash: string,
): string {
  return `${network.explorerUrl}/tx/${txHash}`;
}
