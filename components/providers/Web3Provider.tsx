"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";

import { config, privyAppId } from "@/lib/web3/config";

export function Web3Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={privyAppId}
     config={{
  appearance: {
    theme: "dark",
    accentColor: "#D4AF37",
    showWalletLoginFirst: true,
  },

  loginMethods: ["wallet"],
}}
      >
        <WagmiProvider config={config}>
          {children}
        </WagmiProvider>
      </PrivyProvider>
    </QueryClientProvider>
  );
}

export function isWeb3Configured(): boolean {
  return true;
}

if (!privyAppId) {
  console.error("Missing NEXT_PUBLIC_PRIVY_APP_ID");
}
