/**
 * ATLAS NXR — blockchain adapter interfaces (NO implementations).
 * Business logic must never depend on these; they are enhancement ports.
 */

export type BlockchainNetworkId =
  | "ethereum"
  | "bnb_chain"
  | "polygon"
  | "solana"
  | "nexar_chain"
  | "other";

export type ChainTransferRequest = {
  network: BlockchainNetworkId;
  fromAddress: string;
  toAddress: string;
  amount: string;
  memo?: string;
};

export type ChainTransferResult = {
  network: BlockchainNetworkId;
  txHash: string;
  status: "submitted" | "confirmed" | "failed";
  raw?: Record<string, unknown>;
};

export type ChainBalanceQuery = {
  network: BlockchainNetworkId;
  address: string;
};

/** Adapter contract — implement later per chain without changing domain services. */
export interface NxrBlockchainAdapter {
  readonly network: BlockchainNetworkId;
  getBalance(query: ChainBalanceQuery): Promise<string>;
  submitTransfer(request: ChainTransferRequest): Promise<ChainTransferResult>;
  confirmTransfer(txHash: string): Promise<ChainTransferResult>;
}

export type NxrBlockchainAdapterRegistry = Partial<
  Record<BlockchainNetworkId, NxrBlockchainAdapter>
>;

/** Stub registry — empty until chain adapters are wired. */
export function createEmptyBlockchainRegistry(): NxrBlockchainAdapterRegistry {
  return {};
}

export function assertBlockchainOptional(
  blockchainEnabled: boolean,
  registry: NxrBlockchainAdapterRegistry,
  network: BlockchainNetworkId,
): void {
  if (!blockchainEnabled) {
    throw new Error("Blockchain is disabled — NXR operates off-chain");
  }
  if (!registry[network]) {
    throw new Error(`No blockchain adapter registered for ${network}`);
  }
}
