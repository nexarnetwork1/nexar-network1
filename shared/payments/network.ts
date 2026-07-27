// Blockchain network and explorer mapping
// This file defines the multi-network architecture without implementing blockchain integration

/**
 * Blockchain network enum
 */
export enum BlockchainNetwork {
  // EVM Networks
  ETHEREUM = 'ethereum',
  BNB_SMART_CHAIN = 'bnb_smart_chain',
  POLYGON = 'polygon',
  ARBITRUM = 'arbitrum',
  OPTIMISM = 'optimism',
  AVALANCHE = 'avalanche',
  BASE = 'base',
  
  // Future Networks
  SOLANA = 'solana',
  NEAR = 'near',
  APTOS = 'aptos',
  SUI = 'sui',
  TRON = 'tron',
}

/**
 * Network configuration
 */
export interface NetworkConfig {
  network: BlockchainNetwork;
  name: string;
  shortName: string;
  chainId: number;
  nativeCurrency: string;
  explorerUrl: string;
  blockExplorerUrl: string;
  addressExplorerUrl: string;
  txExplorerUrl: string;
  rpcUrl?: string;
  testnetRpcUrl?: string;
  isTestnet?: boolean;
  supportsEIP1559?: boolean;
  averageBlockTime?: number; // in seconds
}

/**
 * Network configurations
 */
export const NETWORK_CONFIGS: Record<BlockchainNetwork, NetworkConfig> = {
  [BlockchainNetwork.ETHEREUM]: {
    network: BlockchainNetwork.ETHEREUM,
    name: 'Ethereum Mainnet',
    shortName: 'ETH',
    chainId: 1,
    nativeCurrency: 'ETH',
    explorerUrl: 'https://etherscan.io',
    blockExplorerUrl: 'https://etherscan.io',
    addressExplorerUrl: 'https://etherscan.io/address',
    txExplorerUrl: 'https://etherscan.io/tx',
    supportsEIP1559: true,
    averageBlockTime: 12,
  },
  [BlockchainNetwork.BNB_SMART_CHAIN]: {
    network: BlockchainNetwork.BNB_SMART_CHAIN,
    name: 'BNB Smart Chain',
    shortName: 'BSC',
    chainId: 56,
    nativeCurrency: 'BNB',
    explorerUrl: 'https://bscscan.com',
    blockExplorerUrl: 'https://bscscan.com',
    addressExplorerUrl: 'https://bscscan.com/address',
    txExplorerUrl: 'https://bscscan.com/tx',
    supportsEIP1559: true,
    averageBlockTime: 3,
  },
  [BlockchainNetwork.POLYGON]: {
    network: BlockchainNetwork.POLYGON,
    name: 'Polygon Mainnet',
    shortName: 'MATIC',
    chainId: 137,
    nativeCurrency: 'MATIC',
    explorerUrl: 'https://polygonscan.com',
    blockExplorerUrl: 'https://polygonscan.com',
    addressExplorerUrl: 'https://polygonscan.com/address',
    txExplorerUrl: 'https://polygonscan.com/tx',
    supportsEIP1559: true,
    averageBlockTime: 2,
  },
  [BlockchainNetwork.ARBITRUM]: {
    network: BlockchainNetwork.ARBITRUM,
    name: 'Arbitrum One',
    shortName: 'ARB',
    chainId: 42161,
    nativeCurrency: 'ETH',
    explorerUrl: 'https://arbiscan.io',
    blockExplorerUrl: 'https://arbiscan.io',
    addressExplorerUrl: 'https://arbiscan.io/address',
    txExplorerUrl: 'https://arbiscan.io/tx',
    supportsEIP1559: true,
    averageBlockTime: 1,
  },
  [BlockchainNetwork.OPTIMISM]: {
    network: BlockchainNetwork.OPTIMISM,
    name: 'Optimism',
    shortName: 'OP',
    chainId: 10,
    nativeCurrency: 'ETH',
    explorerUrl: 'https://optimistic.etherscan.io',
    blockExplorerUrl: 'https://optimistic.etherscan.io',
    addressExplorerUrl: 'https://optimistic.etherscan.io/address',
    txExplorerUrl: 'https://optimistic.etherscan.io/tx',
    supportsEIP1559: true,
    averageBlockTime: 2,
  },
  [BlockchainNetwork.AVALANCHE]: {
    network: BlockchainNetwork.AVALANCHE,
    name: 'Avalanche C-Chain',
    shortName: 'AVAX',
    chainId: 43114,
    nativeCurrency: 'AVAX',
    explorerUrl: 'https://snowtrace.io',
    blockExplorerUrl: 'https://snowtrace.io',
    addressExplorerUrl: 'https://snowtrace.io/address',
    txExplorerUrl: 'https://snowtrace.io/tx',
    supportsEIP1559: true,
    averageBlockTime: 2,
  },
  [BlockchainNetwork.BASE]: {
    network: BlockchainNetwork.BASE,
    name: 'Base',
    shortName: 'BASE',
    chainId: 8453,
    nativeCurrency: 'ETH',
    explorerUrl: 'https://basescan.org',
    blockExplorerUrl: 'https://basescan.org',
    addressExplorerUrl: 'https://basescan.org/address',
    txExplorerUrl: 'https://basescan.org/tx',
    supportsEIP1559: true,
    averageBlockTime: 2,
  },
  // Future networks (placeholder configurations)
  [BlockchainNetwork.SOLANA]: {
    network: BlockchainNetwork.SOLANA,
    name: 'Solana Mainnet',
    shortName: 'SOL',
    chainId: 0, // Solana doesn't use EVM chainId
    nativeCurrency: 'SOL',
    explorerUrl: 'https://explorer.solana.com',
    blockExplorerUrl: 'https://explorer.solana.com',
    addressExplorerUrl: 'https://explorer.solana.com/address',
    txExplorerUrl: 'https://explorer.solana.com/tx',
    supportsEIP1559: false,
    averageBlockTime: 0.4,
  },
  [BlockchainNetwork.NEAR]: {
    network: BlockchainNetwork.NEAR,
    name: 'NEAR Protocol',
    shortName: 'NEAR',
    chainId: 0, // NEAR doesn't use EVM chainId
    nativeCurrency: 'NEAR',
    explorerUrl: 'https://nearblocks.io',
    blockExplorerUrl: 'https://nearblocks.io',
    addressExplorerUrl: 'https://nearblocks.io/address',
    txExplorerUrl: 'https://nearblocks.io/tx',
    supportsEIP1559: false,
    averageBlockTime: 1,
  },
  [BlockchainNetwork.APTOS]: {
    network: BlockchainNetwork.APTOS,
    name: 'Aptos',
    shortName: 'APT',
    chainId: 0, // Aptos doesn't use EVM chainId
    nativeCurrency: 'APT',
    explorerUrl: 'https://explorer.aptoslabs.com',
    blockExplorerUrl: 'https://explorer.aptoslabs.com',
    addressExplorerUrl: 'https://explorer.aptoslabs.com/address',
    txExplorerUrl: 'https://explorer.aptoslabs.com/tx',
    supportsEIP1559: false,
    averageBlockTime: 0.5,
  },
  [BlockchainNetwork.SUI]: {
    network: BlockchainNetwork.SUI,
    name: 'Sui',
    shortName: 'SUI',
    chainId: 0, // Sui doesn't use EVM chainId
    nativeCurrency: 'SUI',
    explorerUrl: 'https://suiscan.xyz',
    blockExplorerUrl: 'https://suiscan.xyz',
    addressExplorerUrl: 'https://suiscan.xyz/address',
    txExplorerUrl: 'https://suiscan.xyz/tx',
    supportsEIP1559: false,
    averageBlockTime: 0.5,
  },
  [BlockchainNetwork.TRON]: {
    network: BlockchainNetwork.TRON,
    name: 'TRON Mainnet',
    shortName: 'TRX',
    chainId: 0, // TRON doesn't use EVM chainId
    nativeCurrency: 'TRX',
    explorerUrl: 'https://tronscan.org',
    blockExplorerUrl: 'https://tronscan.org',
    addressExplorerUrl: 'https://tronscan.org/address',
    txExplorerUrl: 'https://tronscan.org/transaction',
    supportsEIP1559: false,
    averageBlockTime: 3,
  },
};

/**
 * Get network configuration
 */
export function getNetworkConfig(network: BlockchainNetwork): NetworkConfig {
  return NETWORK_CONFIGS[network];
}

/**
 * Get explorer URL for address
 */
export function getAddressExplorerUrl(network: BlockchainNetwork, address: string): string {
  const config = getNetworkConfig(network);
  return `${config.addressExplorerUrl}/${address}`;
}

/**
 * Get explorer URL for transaction
 */
export function getTransactionExplorerUrl(network: BlockchainNetwork, txHash: string): string {
  const config = getNetworkConfig(network);
  return `${config.txExplorerUrl}/${txHash}`;
}

/**
 * Get explorer URL for block
 */
export function getBlockExplorerUrl(network: BlockchainNetwork, blockNumber: number | string): string {
  const config = getNetworkConfig(network);
  return `${config.blockExplorerUrl}/block/${blockNumber}`;
}

/**
 * Check if network is EVM-compatible
 */
export function isEVMNetwork(network: BlockchainNetwork): boolean {
  const evmNetworks = [
    BlockchainNetwork.ETHEREUM,
    BlockchainNetwork.BNB_SMART_CHAIN,
    BlockchainNetwork.POLYGON,
    BlockchainNetwork.ARBITRUM,
    BlockchainNetwork.OPTIMISM,
    BlockchainNetwork.AVALANCHE,
    BlockchainNetwork.BASE,
  ];
  return evmNetworks.includes(network);
}

/**
 * Get supported networks for payment processing
 */
export function getSupportedPaymentNetworks(): BlockchainNetwork[] {
  return [
    BlockchainNetwork.ETHEREUM,
    BlockchainNetwork.BNB_SMART_CHAIN,
    BlockchainNetwork.POLYGON,
    BlockchainNetwork.ARBITRUM,
    BlockchainNetwork.OPTIMISM,
    BlockchainNetwork.AVALANCHE,
    BlockchainNetwork.BASE,
    BlockchainNetwork.TRON,
  ];
}

/**
 * Get network by chain ID
 */
export function getNetworkByChainId(chainId: number): BlockchainNetwork | null {
  for (const network of Object.values(BlockchainNetwork)) {
    const config = NETWORK_CONFIGS[network];
    if (config.chainId === chainId) {
      return network;
    }
  }
  return null;
}

/**
 * Network validation utility
 */
export function isValidNetwork(network: string): network is BlockchainNetwork {
  return Object.values(BlockchainNetwork).includes(network as BlockchainNetwork);
}

/**
 * Currency to network mapping
 */
export const CURRENCY_NETWORK_MAPPING: Record<string, BlockchainNetwork[]> = {
  'ETH': [BlockchainNetwork.ETHEREUM, BlockchainNetwork.ARBITRUM, BlockchainNetwork.OPTIMISM, BlockchainNetwork.BASE],
  'BNB': [BlockchainNetwork.BNB_SMART_CHAIN],
  'MATIC': [BlockchainNetwork.POLYGON],
  'AVAX': [BlockchainNetwork.AVALANCHE],
  'SOL': [BlockchainNetwork.SOLANA],
  'NEAR': [BlockchainNetwork.NEAR],
  'APT': [BlockchainNetwork.APTOS],
  'SUI': [BlockchainNetwork.SUI],
  'USDT': [BlockchainNetwork.ETHEREUM, BlockchainNetwork.BNB_SMART_CHAIN, BlockchainNetwork.POLYGON, BlockchainNetwork.AVALANCHE],
  'USDC': [BlockchainNetwork.ETHEREUM, BlockchainNetwork.BNB_SMART_CHAIN, BlockchainNetwork.POLYGON, BlockchainNetwork.AVALANCHE],
  'DAI': [BlockchainNetwork.ETHEREUM, BlockchainNetwork.BNB_SMART_CHAIN, BlockchainNetwork.POLYGON],
};

/**
 * Get networks for a specific currency
 */
export function getNetworksForCurrency(currency: string): BlockchainNetwork[] {
  return CURRENCY_NETWORK_MAPPING[currency] || [];
}
