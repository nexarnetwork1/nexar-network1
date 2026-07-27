export const chainsConfig = {
  defaultChainId: 56,
  supported: [
    { chainId: 56, name: "BNB Smart Chain", symbol: "BNB", active: true },
    { chainId: 1, name: "Ethereum", symbol: "ETH", active: false },
    { chainId: 137, name: "Polygon", symbol: "MATIC", active: false },
    { chainId: 101, name: "Solana", symbol: "SOL", active: false },
  ],
} as const;
