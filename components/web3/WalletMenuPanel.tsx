"use client";

import { CheckCircle2, Copy, ExternalLink, LogOut, Coins, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CurrencyLogo } from "@/components/payments/CurrencyLogo";
import { SuperAdminVerifyButton } from "./SuperAdminVerifyButton";
import { AddNxrToWalletButton } from "./AddNxrToWalletButton";
import type { WalletPanelState } from "./useWalletPanel";

type WalletMenuPanelProps = {
  panel: WalletPanelState;
  /** Called after disconnect so overlays can close. */
  onDisconnect?: () => void;
  className?: string;
};

export function WalletMenuPanel({ panel, onDisconnect, className }: WalletMenuPanelProps) {
  const {
    address,
    meta,
    isConnected,
    onBsc,
    networkLabel,
    chainId,
    balances,
    isTreasuryWallet,
    isSuperAdmin,
    setIsSuperAdmin,
    isSwitchingChain,
    copyAddress,
    switchToBsc,
    disconnectWallet,
  } = panel;

  if (!address) return null;

  async function handleDisconnect() {
    await disconnectWallet();
    onDisconnect?.();
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="border-b border-white/10 bg-gradient-to-br from-gold/5 to-transparent px-5 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-xl">
            {meta.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium text-white">{meta.label}</p>
              {isConnected && (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
              )}
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              Connected
            </p>
            <p className="mt-2 break-all font-mono text-[11px] leading-relaxed text-gray-300">
              {address}
            </p>
          </div>
        </div>
      </div>

      {!onBsc && (
        <div className="border-b border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <p className="text-xs text-amber-200/90">Wrong network — switch to BNB Smart Chain to use Nexar features.</p>
          <button
            type="button"
            onClick={switchToBsc}
            disabled={isSwitchingChain}
            className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-100 transition hover:bg-amber-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 disabled:opacity-60"
          >
            <ArrowRightLeft className="h-4 w-4 shrink-0" aria-hidden />
            {isSwitchingChain ? "Switching…" : "Switch to BNB Smart Chain"}
          </button>
        </div>
      )}

      <div className="space-y-2 px-4 py-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted">Network</p>
          <p className="mt-1 text-sm font-medium text-white">{networkLabel}</p>
          <p className="font-mono text-[10px] text-muted">Chain ID {chainId}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { code: "BNB", value: balances.bnb, accent: "text-amber-300" },
            { code: "NXR", value: balances.nxr, accent: "text-gold" },
            { code: "USDT", value: balances.usdt, accent: "text-emerald-400" },
          ].map((item) => (
            <div
              key={item.code}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2.5 text-center"
            >
              <div className="flex items-center justify-center gap-1">
                <CurrencyLogo code={item.code} size={14} />
                <p className="text-[10px] uppercase tracking-wide text-muted">{item.code}</p>
              </div>
              <p className={cn("mt-1 font-mono text-xs font-medium", item.accent)}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-0.5 px-2 pb-3">
        <div className="px-2 py-1">
          <AddNxrToWalletButton size="sm" variant="secondary" className="w-full justify-center min-h-11" />
        </div>

        <button
          type="button"
          onClick={copyAddress}
          className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white transition hover:bg-gold/10 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 active:scale-[0.98]"
        >
          <Copy size={18} aria-hidden />
          Copy address
        </button>

        <a
          href={`https://bscscan.com/address/${address}`}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white transition hover:bg-gold/10 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 active:scale-[0.98]"
        >
          <ExternalLink size={18} aria-hidden />
          View on BscScan
        </a>

        {isTreasuryWallet && !isSuperAdmin && (
          <div className="px-2 py-1">
            <SuperAdminVerifyButton
              walletAddress={address}
              onVerified={() => setIsSuperAdmin(true)}
            />
          </div>
        )}

        {isSuperAdmin && (
          <div className="mx-2 flex items-center gap-2 rounded-2xl border border-gold/20 bg-gold/5 px-4 py-2.5 text-xs text-gold">
            <Coins size={14} aria-hidden />
            Super Admin session active
          </div>
        )}

        <button
          type="button"
          onClick={handleDisconnect}
          className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40 active:scale-[0.98]"
        >
          <LogOut size={18} aria-hidden />
          Disconnect
        </button>
      </div>
    </div>
  );
}
