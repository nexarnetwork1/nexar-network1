"use client";

import { motion } from "framer-motion";
import { Clock, Target, TrendingUp, Wallet } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { StatusDot } from "@/components/ui/StatusDot";
import { usePresaleData } from "@/lib/web3/hooks/usePresaleData";
import { cn } from "@/lib/utils/cn";

function formatDate(timestamp: bigint | undefined): string {
  if (!timestamp) return "—";
  return new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_LABELS = {
  upcoming: { label: "Upcoming", color: "text-amber-400" },
  active: { label: "Live", color: "text-emerald-400" },
  ended: { label: "Ended", color: "text-muted" },
  unknown: { label: "Loading", color: "text-muted" },
} as const;

type PresaleInfoProps = {
  className?: string;
  compact?: boolean;
};

export function PresaleInfo({ className, compact = false }: PresaleInfoProps) {
  const {
    web3Ready,
    status,
    progress,
    soldAmount,
    capAmount,
    presaleStart,
    presaleEnd,
    purchasedAmount,
    claimableAmount,
  } = usePresaleData();

  if (!web3Ready) {
    return (
      <div className={cn("luxury-border rounded-2xl bg-card/40 p-6 backdrop-blur-md", className)}>
        <p className="text-sm text-muted">
          Connect Web3 to view live presale data. Set{" "}
          <code className="text-gold">NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID</code>.
        </p>
      </div>
    );
  }

  const statusMeta = STATUS_LABELS[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn("luxury-border rounded-2xl bg-card/40 backdrop-blur-md", compact ? "p-5" : "p-6", className)}
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusDot
            color={status === "active" ? "green" : "gold"}
            size="sm"
          />
          <span className="text-[11px] tracking-[0.18em] text-muted uppercase">Presale</span>
        </div>
        <span className={cn("text-xs font-medium", statusMeta.color)}>{statusMeta.label}</span>
      </div>

      <div className="mb-2 flex items-baseline justify-between">
        <p className="font-mono text-2xl font-semibold text-white">
          <AnimatedCounter value={Math.round(soldAmount / 1_000_000)} suffix="M" decimals={0} />
        </p>
        <p className="font-mono text-xs text-muted">
          / {capAmount > 0 ? `${Math.round(capAmount / 1_000_000)}M` : "—"} NXR
        </p>
      </div>

      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-border">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${progress}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full bg-gradient-to-r from-gold to-gold-secondary"
        />
      </div>

      <div className={cn("grid gap-3", compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4")}>
        <div className="flex items-start gap-2">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/60" />
          <div>
            <p className="text-[10px] text-muted uppercase">Start</p>
            <p className="font-mono text-[11px] text-white">{formatDate(presaleStart)}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/60" />
          <div>
            <p className="text-[10px] text-muted uppercase">End</p>
            <p className="font-mono text-[11px] text-white">{formatDate(presaleEnd)}</p>
          </div>
        </div>
        {!compact && (
          <>
            <div className="flex items-start gap-2">
              <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/60" />
              <div>
                <p className="text-[10px] text-muted uppercase">Progress</p>
                <p className="font-mono text-[11px] text-white">{progress.toFixed(1)}%</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Wallet className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/60" />
              <div>
                <p className="text-[10px] text-muted uppercase">Your NXR</p>
                <p className="font-mono text-[11px] text-white">
                  {purchasedAmount > 0 ? `${purchasedAmount.toLocaleString()} purchased` : "—"}
                  {claimableAmount > 0 && (
                    <span className="block text-emerald-400">
                      {claimableAmount.toLocaleString()} claimable
                    </span>
                  )}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
