"use client";

import { useEffect, useState } from "react";
import { createPublicClient, http, formatUnits } from "viem";
import { bsc } from "viem/chains";
import { CONTRACTS } from "@/lib/constants/site";
import { subscribePresaleRefresh } from "@/lib/web3/presale-refresh";

export type PresaleTransaction = {
  id: string;
  type: "buy_bnb" | "buy_usdt" | "claim";
  txHash: string;
  blockNumber: bigint;
  timestamp: number;
  nxrAmount: number;
  paymentAmount?: number;
  paymentCurrency?: "BNB" | "USDT";
};

export function usePresaleTransactions(wallet?: `0x${string}`) {
  const [transactions, setTransactions] = useState<PresaleTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(
    () =>
      subscribePresaleRefresh(() => {
        setRefreshNonce((n) => n + 1);
      }),
    []
  );

  useEffect(() => {
    if (!wallet) return;

    let cancelled = false;

    const client = createPublicClient({ chain: bsc, transport: http() });
    const presale = CONTRACTS.presale as `0x${string}`;

    async function load() {
      setIsLoading(true);
      try {
        const currentBlock = await client.getBlockNumber();
        const fromBlock = currentBlock > BigInt(5_000_000) ? currentBlock - BigInt(5_000_000) : BigInt(0);

        const [bnbLogs, usdtLogs, claimLogs] = await Promise.all([
          client.getLogs({
            address: presale,
            event: {
              type: "event",
              name: "PurchasedWithBnb",
              inputs: [
                { indexed: true, name: "buyer", type: "address" },
                { indexed: false, name: "bnbAmount", type: "uint256" },
                { indexed: false, name: "nxrAmount", type: "uint256" },
              ],
            },
            args: { buyer: wallet },
            fromBlock,
            toBlock: currentBlock,
          }),
          client.getLogs({
            address: presale,
            event: {
              type: "event",
              name: "PurchasedWithUsdt",
              inputs: [
                { indexed: true, name: "buyer", type: "address" },
                { indexed: false, name: "usdtAmount", type: "uint256" },
                { indexed: false, name: "nxrAmount", type: "uint256" },
              ],
            },
            args: { buyer: wallet },
            fromBlock,
            toBlock: currentBlock,
          }),
          client.getLogs({
            address: presale,
            event: {
              type: "event",
              name: "Claimed",
              inputs: [
                { indexed: true, name: "buyer", type: "address" },
                { indexed: false, name: "nxrAmount", type: "uint256" },
              ],
            },
            args: { buyer: wallet },
            fromBlock,
            toBlock: currentBlock,
          }),
        ]);

        const blockNumbers = [
          ...bnbLogs.map((l) => l.blockNumber),
          ...usdtLogs.map((l) => l.blockNumber),
          ...claimLogs.map((l) => l.blockNumber),
        ];
        const uniqueBlocks = [...new Set(blockNumbers.map(String))].map((s) => BigInt(s));
        const blockTimestamps = new Map<string, number>();
        await Promise.all(
          uniqueBlocks.slice(0, 50).map(async (bn) => {
            const block = await client.getBlock({ blockNumber: bn });
            blockTimestamps.set(bn.toString(), Number(block.timestamp));
          })
        );

        const txs: PresaleTransaction[] = [
          ...bnbLogs.map((log) => ({
            id: `${log.transactionHash}-bnb`,
            type: "buy_bnb" as const,
            txHash: log.transactionHash!,
            blockNumber: log.blockNumber!,
            timestamp: blockTimestamps.get(log.blockNumber!.toString()) ?? 0,
            nxrAmount: Number(formatUnits(log.args.nxrAmount!, 18)),
            paymentAmount: Number(formatUnits(log.args.bnbAmount!, 18)),
            paymentCurrency: "BNB" as const,
          })),
          ...usdtLogs.map((log) => ({
            id: `${log.transactionHash}-usdt`,
            type: "buy_usdt" as const,
            txHash: log.transactionHash!,
            blockNumber: log.blockNumber!,
            timestamp: blockTimestamps.get(log.blockNumber!.toString()) ?? 0,
            nxrAmount: Number(formatUnits(log.args.nxrAmount!, 18)),
            paymentAmount: Number(formatUnits(log.args.usdtAmount!, 18)),
            paymentCurrency: "USDT" as const,
          })),
          ...claimLogs.map((log) => ({
            id: `${log.transactionHash}-claim`,
            type: "claim" as const,
            txHash: log.transactionHash!,
            blockNumber: log.blockNumber!,
            timestamp: blockTimestamps.get(log.blockNumber!.toString()) ?? 0,
            nxrAmount: Number(formatUnits(log.args.nxrAmount!, 18)),
          })),
        ].sort((a, b) => b.timestamp - a.timestamp);

        if (!cancelled) setTransactions(txs);
      } catch {
        if (!cancelled) setTransactions([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [wallet, refreshNonce]);

  return { transactions: wallet ? transactions : [], isLoading: Boolean(wallet) && isLoading };
}
