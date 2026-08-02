"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { cn } from "@/lib/utils/cn";
import { isWeb3Configured } from "@/components/providers/Web3Provider";
import { markWalletSessionActive } from "@/lib/web3/wallet-session";
import { useWalletPanel } from "./useWalletPanel";
import { WalletMobileSheet } from "./WalletMobileSheet";

type WalletIconButtonProps = {
  className?: string;
};

export function WalletIconButton({ className }: WalletIconButtonProps) {
  const { login, ready, authenticated } = usePrivy();
  const [connecting, setConnecting] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const panel = useWalletPanel();

  if (!isWeb3Configured()) {
    return (
      <button
        type="button"
        disabled
        title="Wallet provider not configured"
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full border border-border text-muted opacity-50",
          className,
        )}
        aria-label="Wallet unavailable"
      >
        <Wallet className="h-5 w-5" aria-hidden />
      </button>
    );
  }

  async function handleClick() {
    if (!ready || connecting) return;

    if (authenticated && panel.address) {
      setSheetOpen(true);
      return;
    }

    setConnecting(true);
    try {
      markWalletSessionActive();
      await login();
    } catch {
      // Privy surfaces wallet errors in its modal
    } finally {
      setConnecting(false);
    }
  }

  const connected = authenticated && Boolean(panel.address);

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={!ready || connecting}
        aria-label={connected ? "Open wallet menu" : "Connect wallet"}
        aria-expanded={sheetOpen}
        aria-haspopup={connected ? "dialog" : undefined}
        className={cn(
          "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          connected
            ? "border-gold/30 bg-gold/10 text-gold hover:border-gold/50"
            : "border-border text-white hover:border-gold/30 hover:text-gold",
          className,
        )}
      >
        <Wallet className="h-5 w-5" aria-hidden />
        {connected && (
          <span
            className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background"
            aria-hidden
          />
        )}
      </button>

      {connected && (
        <WalletMobileSheet open={sheetOpen} onClose={() => setSheetOpen(false)} panel={panel} />
      )}
    </>
  );
}
