'use client'

import { wagmiAdapter, projectId, metadata } from '@/lib/web3/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { bsc, mainnet, polygon, arbitrum, avalanche } from '@reown/appkit/networks'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

// Set up queryClient
const queryClient = new QueryClient()

// Create the AppKit modal with official configuration
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [bsc, mainnet, polygon, arbitrum, avalanche],
  defaultNetwork: bsc,
  metadata,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
    email: false, // Disable email login
    socials: [], // Disable all social logins (Google, X, GitHub, Discord, Apple, Facebook, Farcaster)
  },
  allWallets: 'SHOW', // Show all wallets from WalletConnect Explorer (540+ wallets)
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#000000',
    '--w3m-color-mix-strength': 40,
  },
  enableNetworkSwitch: true,
  enableReconnect: true,
  enableMobileFullScreen: true,
})

export function Web3Provider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
