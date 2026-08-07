import type { PresaleNetworkConfig } from "@/lib/constants/presale-networks";

type SwitchChainAsyncFn = (args: { chainId: number }) => Promise<unknown>;

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

/**
 * Request wallet network switch; if the chain is missing, offer Add Network.
 * Never auto-connect — caller must ensure wallet is already connected.
 */
export async function requestPresaleNetworkSwitch(
  switchChainAsync: SwitchChainAsyncFn,
  network: PresaleNetworkConfig,
): Promise<void> {
  try {
    await switchChainAsync({ chainId: network.chainId });
    return;
  } catch (error) {
    const code = (error as { code?: number })?.code;
    if (code !== 4902) throw error;
  }

  const ethereum = (globalThis as typeof globalThis & { ethereum?: EthereumProvider })
    .ethereum;
  if (!ethereum) {
    throw new Error(`${network.name} is not available in this wallet.`);
  }

  await ethereum.request({
    method: "wallet_addEthereumChain",
    params: [
      {
        chainId: `0x${network.chainId.toString(16)}`,
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

  await switchChainAsync({ chainId: network.chainId });
}
