"use client";

import { useEffect, useState } from 'react';
import { createAppKit } from '@reown/appkit/react';
import { wagmiAdapter, projectId, metadata } from '@/lib/web3/config';
import { bsc, mainnet, polygon, arbitrum, avalanche } from '@reown/appkit/networks';

let appKitInstance: ReturnType<typeof createAppKit> | null = null;

export function getAppKit() {
  return appKitInstance;
}

export function AppKitInit() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (appKitInstance || isInitialized) return;

    try {
      appKitInstance = createAppKit({
        adapters: [wagmiAdapter],
        networks: [bsc, mainnet, polygon, arbitrum, avalanche],
        metadata,
        projectId,
        // Set BNB Smart Chain as default network
        defaultNetwork: bsc,
        themeMode: 'dark',
        themeVariables: {
          '--w3m-color-mix': '#000000',
          '--w3m-color-mix-strength': 40,
        },
        // Show all wallets from WalletConnect Explorer on all platforms
        // This loads the complete official WalletConnect Explorer directory automatically
        allWallets: 'SHOW',
        // Ensure mobile shows same wallet modal as desktop
        enableMobileFullScreen: true,
        // Enable network switching
        enableNetworkSwitch: true,
        // Enable wallet reconnection
        enableReconnect: true,
      });
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize AppKit:', error);
    }
  }, [isInitialized]);

  return null;
}
