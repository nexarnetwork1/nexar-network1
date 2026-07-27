"use client";

import { useAccount } from "wagmi";
import { usePresaleData } from "@/lib/web3/hooks/usePresaleData";

export function PresalePortfolio() {
  const { address } = useAccount();
  const {
    purchasedAmount,
    claimableAmount,
    claimedAmount,
    status,
    isLoading,
  } = usePresaleData();

  if (!address) {
    return (
      <div className="luxury-border rounded-2xl bg-card/40 p-5 backdrop-blur-md">
        <h2 className="font-heading text-lg font-semibold">Your Portfolio</h2>
        <p className="mt-3 text-sm text-muted">Connect wallet to view your presale holdings.</p>
      </div>
    );
  }

  return (
    <div className="luxury-border rounded-2xl bg-card/40 p-5 backdrop-blur-md">
      <h2 className="font-heading text-lg font-semibold">Your Portfolio</h2>
      {isLoading ? (
        <p className="mt-3 text-sm text-muted">Loading from contract…</p>
      ) : (
        <dl className="mt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <dt className="text-muted">Purchased</dt>
            <dd className="font-mono">{purchasedAmount.toLocaleString()} NXR</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-muted">Claimable</dt>
            <dd className="font-mono text-emerald-400">{claimableAmount.toLocaleString()} NXR</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-muted">Claimed</dt>
            <dd className="font-mono">{claimedAmount.toLocaleString()} NXR</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-muted">Presale status</dt>
            <dd className="capitalize">{status.replace("_", " ")}</dd>
          </div>
        </dl>
      )}
      <p className="mt-4 font-mono text-[10px] text-muted/60 break-all">{address}</p>
    </div>
  );
}
