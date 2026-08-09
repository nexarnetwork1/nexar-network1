"use client";

import { useEffect, useState } from "react";
import {
  disconnectWalletAction,
  getWalletConnectionAction,
} from "@/modules/atlas-auth/wallet-actions";
import { AtlasWalletConnectPanel } from "@/components/atlas/auth/AtlasWalletConnectPanel";

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function AtlasProfileWalletSection() {
  const [wallet, setWallet] = useState<{
    walletAddress: string;
    chainId: number;
    isVerified: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getWalletConnectionAction().then((record) => {
      setWallet(
        record
          ? {
              walletAddress: record.walletAddress,
              chainId: record.chainId,
              isVerified: record.isVerified,
            }
          : null,
      );
      setLoading(false);
    });
  }, []);

  async function handleDisconnect() {
    const result = await disconnectWalletAction();
    if (result.success) setWallet(null);
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading wallet…</p>;
  }

  return (
    <section className="rounded-xl border border-border bg-card/40 p-4">
      <h3 className="text-sm font-semibold text-foreground">Wallet</h3>
      {wallet?.isVerified ? (
        <div className="mt-3 space-y-2 text-sm">
          <p className="text-emerald-400">Connected</p>
          <p className="text-muted">BNB Smart Chain (chain {wallet.chainId})</p>
          <p className="font-mono text-xs text-foreground">{truncateAddress(wallet.walletAddress)}</p>
          <div className="flex gap-2 pt-1">
            <a
              href={`https://bscscan.com/address/${wallet.walletAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gold hover:underline"
            >
              View
            </a>
            <button
              type="button"
              onClick={() => void handleDisconnect()}
              className="text-xs text-red-400 hover:underline"
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-muted">Not connected</p>
          <AtlasWalletConnectPanel
            requireAuth
            onLinked={() => {
              void getWalletConnectionAction().then((record) => {
                if (record) {
                  setWallet({
                    walletAddress: record.walletAddress,
                    chainId: record.chainId,
                    isVerified: record.isVerified,
                  });
                }
              });
            }}
          />
        </div>
      )}
    </section>
  );
}
