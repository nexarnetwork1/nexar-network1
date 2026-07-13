import { cookieStorage, createStorage } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { bsc, mainnet, polygon, arbitrum, avalanche } from '@reown/appkit/networks'

// Get projectId from environment or use the existing Reown Project ID
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'ed68a1decb1758bdd2fc2c67e65a21f6'

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Create metadata for AppKit
export const metadata = {
  name: 'Nexar Network',
  description: 'Next-generation decentralized network',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://nexarnetwork.io',
  icons: ['https://nexarnetwork.io/favicon.ico'],
}

// Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks: [bsc, mainnet, polygon, arbitrum, avalanche],
})

// Export wagmi config from adapter
export const wagmiConfig = wagmiAdapter.wagmiConfig
