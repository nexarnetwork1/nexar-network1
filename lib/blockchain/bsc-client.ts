import { createPublicClient, http, formatUnits, parseUnits } from "viem";
import { bsc } from "viem/chains";

export const bscClient = createPublicClient({
  chain: bsc,
  transport: http(process.env.BSC_RPC_URL ?? "https://bsc-dataseed.binance.org"),
});

export const ERC20_TRANSFER_ABI = [
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
] as const;

export const ERC20_BALANCE_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export type CryptoAsset = "BNB" | "NXR" | "USDT";

export function getTokenAddress(asset: CryptoAsset): `0x${string}` | null {
  if (asset === "BNB") return null;
  if (asset === "USDT") {
    return (process.env.USDT_TOKEN_ADDRESS ??
      "0x55d398326f99059fF775485246099027B3197955") as `0x${string}`;
  }
  if (asset === "NXR") {
    return (process.env.NXR_TOKEN_ADDRESS ??
      "0x3c7c9eeA8826e5bcB4ed2b798123915Cd596c909") as `0x${string}`;
  }
  return null;
}

export async function getNativeBalance(address: `0x${string}`): Promise<bigint> {
  return bscClient.getBalance({ address });
}

export async function getTokenBalance(
  tokenAddress: `0x${string}`,
  walletAddress: `0x${string}`
): Promise<bigint> {
  return bscClient.readContract({
    address: tokenAddress,
    abi: ERC20_BALANCE_ABI,
    functionName: "balanceOf",
    args: [walletAddress],
  });
}

export function toDecimal(amount: bigint, decimals: number): number {
  return Number(formatUnits(amount, decimals));
}

export function toWei(amount: number, decimals: number): bigint {
  return parseUnits(amount.toFixed(decimals), decimals);
}

export async function getTransactionReceipt(txHash: `0x${string}`) {
  return bscClient.getTransactionReceipt({ hash: txHash });
}
