"use client";

import { useAccount } from "wagmi";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { usePresaleTransactions } from "@/lib/web3/hooks/usePresaleTransactions";
import { usePresaleNetworkContext } from "@/components/providers/PresaleNetworkProvider";
import { getExplorerTxUrl } from "@/lib/constants/presale-networks";
import { CurrencyLogo } from "@/components/payments/CurrencyLogo";

export function PresaleTransactionHistory() {
  const { address } = useAccount();
  const { network } = usePresaleNetworkContext();
  const { transactions, isLoading } = usePresaleTransactions(address);

  return (
    <div className="luxury-border rounded-2xl bg-card/60 p-5 backdrop-blur-md">
      <h2 className="font-heading text-lg font-semibold">Transaction History</h2>

      {!address && (
        <p className="mt-3 text-sm text-muted">Connect wallet to view on-chain history.</p>
      )}

      {address && isLoading && (
        <p className="mt-3 text-sm text-muted">
          Loading events from {network.shortName}…
        </p>
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
                <p className="flex items-center gap-1.5 font-medium capitalize">
                  {tx.type === "buy_usdt" ? (
                    <>
                      Buy (<CurrencyLogo code="USDT" size={12} /> USDT)
                    </>
                  ) : tx.type === "buy_bnb" ? (
                    "Buy"
                  ) : (
                    "Claim"
                  )}
                </p>
                <p className="flex items-center gap-1.5 text-muted">
                  <CurrencyLogo code="NXR" size={12} />
                  {tx.nxrAmount.toLocaleString()} NXR
                  {tx.paymentAmount != null && tx.paymentCurrency && (
                    <>
                      {" · "}
                      <CurrencyLogo code={tx.paymentCurrency} size={12} />
                      {tx.paymentAmount} {tx.paymentCurrency}
                    </>
                  )}
                </p>
              </div>
              <Link
                href={getExplorerTxUrl(network, tx.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline"
                aria-label={`View on ${network.explorerName}`}
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
