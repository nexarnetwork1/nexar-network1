import {
  bscClient,
  getNativeBalance,
  getTokenBalance,
  getTokenAddress,
  toDecimal,
  toWei,
  type CryptoAsset,
} from "./bsc-client";

export async function verifyCryptoPayment(
  depositAddress: `0x${string}`,
  expectedAmount: number,
  asset: CryptoAsset,
  tolerance = 0.01
): Promise<{ verified: boolean; received: number; txHash?: string }> {
  const decimals = 18;
  const expectedWei = toWei(expectedAmount, decimals);

  if (asset === "BNB") {
    const balance = await getNativeBalance(depositAddress);
    const received = toDecimal(balance, decimals);
    if (balance >= expectedWei * BigInt(99) / BigInt(100)) {
      return { verified: true, received };
    }
    return { verified: false, received };
  }

  const tokenAddress = getTokenAddress(asset);
  if (!tokenAddress) return { verified: false, received: 0 };

  const balance = await getTokenBalance(tokenAddress, depositAddress);
  const received = toDecimal(balance, decimals);
  const minAcceptable = expectedAmount * (1 - tolerance);

  if (received >= minAcceptable) {
    return { verified: true, received };
  }

  return { verified: false, received };
}

export async function findIncomingTxHash(
  depositAddress: `0x${string}`,
  asset: CryptoAsset,
  fromBlock?: bigint
): Promise<string | null> {
  const blockNumber =
    fromBlock ?? (await bscClient.getBlockNumber()) - BigInt(500);

  if (asset === "BNB") {
    const latest = await bscClient.getBlockNumber();
    for (let i = latest; i > blockNumber; i -= BigInt(1)) {
      const block = await bscClient.getBlock({ blockNumber: i, includeTransactions: true });
      if (!block?.transactions) continue;
      for (const tx of block.transactions) {
        if (typeof tx === "string") continue;
        if (
          tx.to?.toLowerCase() === depositAddress.toLowerCase() &&
          tx.value > BigInt(0)
        ) {
          return tx.hash;
        }
      }
    }
    return null;
  }

  const tokenAddress = getTokenAddress(asset);
  if (!tokenAddress) return null;

  const logs = await bscClient.getLogs({
    address: tokenAddress,
    event: {
      type: "event",
      name: "Transfer",
      inputs: [
        { name: "from", type: "address", indexed: true },
        { name: "to", type: "address", indexed: true },
        { name: "value", type: "uint256", indexed: false },
      ],
    },
    args: { to: depositAddress },
    fromBlock: blockNumber,
    toBlock: "latest",
  });

  if (logs.length > 0) {
    return logs[logs.length - 1].transactionHash;
  }

  return null;
}
