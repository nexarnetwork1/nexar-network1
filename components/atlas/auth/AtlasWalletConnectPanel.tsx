"use client";

import { useState } from "react";
import { Loader2, Wallet } from "lucide-react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { isWeb3Configured } from "@/components/providers/Web3Provider";
import {
  requestWalletLinkChallengeAction,
  verifyWalletLinkAction,
} from "@/modules/atlas-auth/wallet-actions";
import { cn } from "@/lib/utils/cn";

type AtlasWalletConnectPanelProps = {
  /** When false, wallet can only be linked after sign-in (default). */
  requireAuth?: boolean;
  onLinked?: (address: string) => void;
  onAddress?: (address: string) => void;
  className?: string;
};

export function AtlasWalletConnectPanel({
  requireAuth = true,
  onLinked,
  onAddress,
  className,
}: AtlasWalletConnectPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkedAddress, setLinkedAddress] = useState<string | null>(null);
  const { login, ready, authenticated } = usePrivy();
  const { wallets } = useWallets();

  async function connectAndVerify() {
    if (!isWeb3Configured()) {
      setError("Wallet provider is not configured.");
      return;
    }
    if (!ready || loading) return;

    setLoading(true);
    setError(null);

    try {
      if (!authenticated) {
        await login();
      }

      const wallet =
        wallets.find((w) => w.walletClientType !== "privy") ?? wallets[0];
      const address = wallet?.address;
      if (!address) {
        setError("No wallet address available.");
        return;
      }

      onAddress?.(address);

      if (requireAuth && !authenticated) {
        setError("Sign in first, then connect your wallet.");
        return;
      }

      const challenge = await requestWalletLinkChallengeAction(address);
      if (!challenge.success) {
        if (requireAuth) {
          setError(challenge.error ?? "Connect wallet after signing in.");
        } else {
          onAddress?.(address);
        }
        return;
      }

      const provider = await wallet.getEthereumProvider();
      const signature = (await provider.request({
        method: "personal_sign",
        params: [challenge.message, address],
      })) as string;

      const verified = await verifyWalletLinkAction({
        walletAddress: address,
        signature,
        message: challenge.message,
        provider: wallet.walletClientType,
      });

      if (!verified.success) {
        setError(verified.error ?? "Wallet verification failed.");
        return;
      }

      setLinkedAddress(address);
      onLinked?.(address);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet connection failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        disabled={!isWeb3Configured() || !ready || loading}
        onClick={() => void connectAndVerify()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold/25 bg-gold/5 px-4 py-2.5 text-sm font-medium text-gold transition-all hover:border-gold/40 hover:bg-gold/10 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Wallet className="h-4 w-4 shrink-0" aria-hidden />
        )}
        {linkedAddress ? "Wallet connected" : loading ? "Connecting…" : "Connect Wallet"}
      </button>
      <p className="text-[10px] text-muted text-center">
        Optional — MetaMask, WalletConnect, Trust Wallet, and other EVM wallets via Privy.
      </p>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
