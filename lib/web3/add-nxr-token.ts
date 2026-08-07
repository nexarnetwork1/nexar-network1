import { getPresaleNetwork } from "@/lib/constants/presale-networks";

const bscNetwork = getPresaleNetwork("bsc");

export const NXR_WATCH_ASSET = {
  type: "ERC20" as const,
  options: {
    address: bscNetwork.contracts.token,
    symbol: "NXR",
    decimals: 18,
    image: "https://www.nexarnetwork.org/logo.png",
  },
  chainId: bscNetwork.chainId,
  tokenName: "Nexar Network",
} as const;

type EthereumProvider = {
  request: (args: { method: string; params?: unknown }) => Promise<unknown>;
};

export async function addNxrToWallet(provider: EthereumProvider): Promise<void> {
  await provider.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: `0x${NXR_WATCH_ASSET.chainId.toString(16)}` }],
  }).catch((error: unknown) => {
    const code = (error as { code?: number })?.code;
    if (code !== 4902) throw error;
    return provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: `0x${NXR_WATCH_ASSET.chainId.toString(16)}`,
          chainName: bscNetwork.name,
          nativeCurrency: {
            name: bscNetwork.nativeSymbol,
            symbol: bscNetwork.nativeSymbol,
            decimals: 18,
          },
          rpcUrls: [bscNetwork.rpcUrl],
          blockExplorerUrls: [bscNetwork.explorerUrl],
        },
      ],
    });
  });

  const added = await provider.request({
    method: "wallet_watchAsset",
    params: {
      type: NXR_WATCH_ASSET.type,
      options: {
        ...NXR_WATCH_ASSET.options,
        name: NXR_WATCH_ASSET.tokenName,
      },
    },
  });

  if (added === false) {
    throw new Error("Token import was declined.");
  }
}

export function getWatchAssetErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (/reject/i.test(error.message)) return "Request cancelled in wallet.";
    if (/already/i.test(error.message)) return "NXR is already in your wallet.";
    return error.message;
  }
  return "Unable to add NXR to wallet.";
}
