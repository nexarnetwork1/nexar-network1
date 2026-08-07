"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { config, privyAppId, bsc, botChain } from "@/lib/web3/config";
import { WalletSessionManager } from "@/components/web3/WalletSessionManager";

export function Web3Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  if (!privyAppId) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={privyAppId}
        config={{
          appearance: {
            theme: "dark",
            accentColor: "#FFD15C",
            showWalletLoginFirst: true,
            walletList: [
              "metamask",
              "coinbase_wallet",
              "wallet_connect",
              "detected_ethereum_wallets",
            ],
          },
          loginMethods: ["wallet"],
          defaultChain: bsc,
          supportedChains: [bsc, botChain],
        }}
      >
        <WagmiProvider config={config} reconnectOnMount>
          <WalletSessionManager />
          {children}
        </WagmiProvider>
      </PrivyProvider>
    </QueryClientProvider>
  );
}

export function isWeb3Configured(): boolean {
  return Boolean(privyAppId);
}
