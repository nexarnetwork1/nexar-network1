"use client";

import { useState } from "react";
import { createAppKit } from "@reown/appkit/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import {
  appKitMetadata,
  bscChain,
  projectId,
  wagmiAdapter,
  wagmiConfig,
} from "@/lib/web3/config";
import { COLORS } from "@/lib/constants/design";

// createAppKit must run once at module level (safe — it only registers the modal,
// it does not hold any per-request user state).
if (projectId) {
  createAppKit({
    adapters: [wagmiAdapter],
    networks: [bscChain],
    projectId,
    metadata: appKitMetadata,
    features: {
      analytics: false,
    },
    themeMode: "dark",
    themeVariables: {
      "--w3m-accent": COLORS.gold,
      "--w3m-border-radius-master": "16px",
    },
  });
}

type Web3ProviderProps = {
  children: React.ReactNode;
};

export function Web3Provider({ children }: Web3ProviderProps) {
  // QueryClient is created inside the component so each SSR request gets its
  // own isolated instance, preventing data leakage between concurrent renders.
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

export function isWeb3Configured(): boolean {
  return Boolean(projectId);
}
