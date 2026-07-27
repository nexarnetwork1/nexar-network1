"use client";

import { useAccount } from "wagmi";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { usePresaleTransactions } from "@/lib/web3/hooks/usePresaleTransactions";

export function PresaleTransactionHistory() {
  const { address } = useAccount();
  const { transactions, isLoading } = usePresaleTransactions(address);

  return (
    <div className="luxury-border rounded-2xl bg-card/40 p-5 backdrop-blur-md">
      <h2 className="font-heading text-lg font-semibold">Transaction History</h2>

      {!address && (
        <p className="mt-3 text-sm text-muted">Connect wallet to view on-chain history.</p>
      )}

      {address && isLoading && (
        <p className="mt-3 text-sm text-muted">Loading events from BSC…</p>
      )}

      {address && !isLoading && transactions.length === 0 && (
        <p className="mt-3 text-sm text-muted">No presale transactions yet.</p>
      )}

      {transactions.length > 0 && (
        <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
          {transactions.map((tx) => (
            <li
              key={tx.id}
              className="flex items-center justify-between rounded-xl border border-border bg-background/50 px-3 py-2 text-xs"
            >
              <div>
                <p className="font-medium capitalize">
                  {tx.type === "buy_bnb"
                    ? "Buy (BNB)"
                    : tx.type === "buy_usdt"
                      ? "Buy (USDT)"
                      : "Claim"}
                </p>
                <p className="text-muted">
                  {tx.nxrAmount.toLocaleString()} NXR
                  {tx.paymentAmount != null && ` · ${tx.paymentAmount} ${tx.paymentCurrency}`}
                </p>
              </div>
              <Link
                href={`https://bscscan.com/tx/${tx.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline"
                aria-label="View on BscScan"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
