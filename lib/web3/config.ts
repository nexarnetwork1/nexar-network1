import { QueryClient } from '@tanstack/react-query'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { bsc, mainnet, polygon, arbitrum, avalanche } from '@reown/appkit/networks'

// Get projectId from environment or use the new Reown Project ID
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'ed68a1decb1758bdd2fc2c67e65a21f6'

// Create metadata for AppKit
export const metadata = {
  name: 'Nexar Network',
  description: 'Next-generation decentralized network',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://nexarnetwork.io',
  icons: ['https://nexarnetwork.io/favicon.ico'],
}

// Create Wagmi adapter
export const wagmiAdapter = new WagmiAdapter({
  networks: [bsc, mainnet, polygon, arbitrum, avalanche],
  projectId,
  ssr: true,
})

// Export wagmi config from adapter
export const wagmiConfig = wagmiAdapter.wagmiConfig

// Create QueryClient
export const queryClient = new QueryClient()
