"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { bsc } from "wagmi/chains";

import { config, privyAppId } from "@/lib/web3/config";
import { TreasuryAdminAutoVerify } from "@/components/web3/TreasuryAdminAutoVerify";

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
            accentColor: "#D4AF37",
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
          supportedChains: [bsc],
        }}
      >
        <WagmiProvider config={config}>
          <TreasuryAdminAutoVerify />
          {children}
        </WagmiProvider>
      </PrivyProvider>
    </QueryClientProvider>
  );
}

export function isWeb3Configured(): boolean {
  return Boolean(privyAppId);
}
