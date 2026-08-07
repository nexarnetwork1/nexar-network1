import {
  DEFAULT_PRESALE_NETWORK_ID,
  getPresaleNetwork,
  getPresaleNetworkByChainId,
  type PresaleNetworkConfig,
} from "@/lib/constants/presale-networks";
import type { EthereumProvider } from "@/lib/web3/active-wallet";

const NXR_LOGO = "https://www.nexarnetwork.org/logo.png";

export function buildNxrWatchAsset(network: PresaleNetworkConfig) {
  return {
    type: "ERC20" as const,
    options: {
      address: network.contracts.token,
      symbol: "NXR",
      decimals: 18,
      image: NXR_LOGO,
    },
    chainId: network.chainId,
    tokenName: "Nexar Network",
    network,
  };
}

async function ensureChain(provider: EthereumProvider, network: PresaleNetworkConfig) {
  const chainIdHex = `0x${network.chainId.toString(16)}`;

  await provider
    .request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    })
    .catch(async (error: unknown) => {
      const code = (error as { code?: number })?.code;
      if (code !== 4902) throw error;

      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: chainIdHex,
            chainName: network.name,
            nativeCurrency: {
              name: network.nativeSymbol,
              symbol: network.nativeSymbol,
              decimals: 18,
            },
            rpcUrls: [network.rpcUrl],
            blockExplorerUrls: [network.explorerUrl],
          },
        ],
      });
    });
}

export async function addNxrToWallet(
  provider: EthereumProvider,
  chainId: number,
): Promise<PresaleNetworkConfig> {
  const network =
    getPresaleNetworkByChainId(chainId) ?? getPresaleNetwork(DEFAULT_PRESALE_NETWORK_ID);

  await ensureChain(provider, network);

  const asset = buildNxrWatchAsset(network);
  const added = await provider.request({
    method: "wallet_watchAsset",
    params: {
      type: asset.type,
      options: {
        ...asset.options,
        name: asset.tokenName,
      },
    },
  });

  if (added === false) {
    throw new Error("Token import was declined.");
  }

  return network;
}

export function getWatchAssetErrorMessage(error: unknown): string {
  const code = (error as { code?: number })?.code;
  if (code === 4001) return "Request cancelled in wallet.";

  if (error instanceof Error) {
    if (/reject/i.test(error.message)) return "Request cancelled in wallet.";
    if (/already/i.test(error.message)) return "NXR is already in your wallet.";
    return error.message;
  }
  return "Unable to add NXR to wallet.";
}

/** @deprecated Use buildNxrWatchAsset(getPresaleNetwork("bsc")) — kept for imports. */
export const NXR_WATCH_ASSET = buildNxrWatchAsset(getPresaleNetwork("bsc"));
