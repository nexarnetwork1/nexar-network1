import type { ConnectedWallet } from "@privy-io/react-auth";

type WalletLike = Pick<ConnectedWallet, "address" | "walletClientType" | "connectorType">;

/**
 * Prefer the wallet that matches the active wagmi address, then any external
 * connector (MetaMask, Rabby, Coinbase, WalletConnect), not an embedded default.
 */
export function resolveActivePrivyWallet(
  wallets: WalletLike[],
  activeAddress?: string | null,
): WalletLike | undefined {
  if (!wallets.length) return undefined;

  if (activeAddress) {
    const normalized = activeAddress.toLowerCase();
    const matched = wallets.find((w) => w.address?.toLowerCase() === normalized);
    if (matched) return matched;
  }

  const external = wallets.find(
    (w) =>
      w.walletClientType !== "privy" &&
      w.connectorType !== "embedded" &&
      Boolean(w.address),
  );
  if (external) return external;

  return wallets.find((w) => Boolean(w.address)) ?? wallets[0];
}

export type EthereumProvider = {
  request: (args: { method: string; params?: unknown }) => Promise<unknown>;
};

export async function getWalletEthereumProvider(
  wallet: WalletLike & {
    getEthereumProvider?: () => Promise<EthereumProvider>;
  },
): Promise<EthereumProvider | null> {
  const provider = await wallet.getEthereumProvider?.();
  return provider ?? null;
}
