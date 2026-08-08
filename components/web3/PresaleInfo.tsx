"use client";

import { motion } from "framer-motion";
import { Clock, Target, TrendingUp, Wallet } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { StatusDot } from "@/components/ui/StatusDot";
import { usePresaleData } from "@/lib/web3/hooks/usePresaleData";
import { getPresaleDisplayMetrics, PRESALE_NXR_PER_USDT } from "@/lib/web3/presale-display";
import { PresaleCountdown } from "@/components/web3/PresaleCountdown";
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
  upcoming: { label: "Upcoming", color: "text-gold" },
  live: { label: "Live", color: "text-success" },
  sold_out: { label: "Sold Out", color: "text-red-400" },
  ended: { label: "Ended", color: "text-muted" },
  loading: { label: "Loading", color: "text-muted" },
  error: { label: "Error", color: "text-red-400" },
} as const;

type PresaleInfoProps = {
  className?: string;
  compact?: boolean;
};

export function PresaleInfo({ className, compact = false }: PresaleInfoProps) {
  const {
    status,
    soldAmount,
    presaleStart,
    presaleEnd,
    purchasedAmount,
    claimableAmount,
    claimedAmount,
    countdownSeconds,
    isLoading,
  } = usePresaleData();

  const { capAmount, remainingAmount, progress } = getPresaleDisplayMetrics(soldAmount);

  const statusMeta = STATUS_LABELS[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn("luxury-border rounded-2xl bg-card/60 backdrop-blur-md", compact ? "p-5" : "p-6", className)}
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusDot color={status === "live" ? "green" : "gold"} size="sm" />
          <span className="text-[11px] tracking-[0.18em] text-muted uppercase">Presale</span>
        </div>
        <span className={cn("text-xs font-medium", statusMeta.color)}>{statusMeta.label}</span>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">Reading contract…</p>
      ) : (
        <>
          <div className="mb-2 flex items-baseline justify-between">
            <p className="font-mono text-2xl font-semibold text-white">
              {soldAmount >= 1_000_000 ? (
                <AnimatedCounter value={Math.round(soldAmount / 1_000_000)} suffix="M" decimals={0} />
              ) : (
                soldAmount.toLocaleString()
              )}
            </p>
            <p className="font-mono text-xs text-muted">
              / {capAmount > 0 ? capAmount.toLocaleString() : "—"} NXR
            </p>
          </div>

          <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-border">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full bg-gradient-to-r from-gold to-gold-secondary"
            />
          </div>

          {(status === "upcoming" || status === "live") && countdownSeconds > 0 && (
            <PresaleCountdown
              seconds={countdownSeconds}
              label={status === "upcoming" ? "Starts in" : "Ends in"}
            />
          )}

          {PRESALE_NXR_PER_USDT > 0 && (
            <p className="mb-4 text-center font-mono text-xs text-gold">
              {PRESALE_NXR_PER_USDT} NXR per 1 USDT
            </p>
          )}

          <div className={cn("grid gap-3", compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4")}>
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/60" aria-hidden />
              <div>
                <p className="text-[10px] text-muted uppercase">Start</p>
                <p className="font-mono text-[11px] text-white">{formatDate(presaleStart)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/60" aria-hidden />
              <div>
                <p className="text-[10px] text-muted uppercase">End</p>
                <p className="font-mono text-[11px] text-white">{formatDate(presaleEnd)}</p>
              </div>
            </div>
            {!compact && (
              <>
                <div className="flex items-start gap-2">
                  <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/60" aria-hidden />
                  <div>
                    <p className="text-[10px] text-muted uppercase">Remaining</p>
                    <p className="font-mono text-[11px] text-white">{remainingAmount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Wallet className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/60" aria-hidden />
                  <div>
                    <p className="text-[10px] text-muted uppercase">Your NXR</p>
                    <p className="font-mono text-[11px] text-white">
                      {purchasedAmount > 0 ? purchasedAmount.toLocaleString() : "—"}
                      {claimableAmount > 0 && (
                        <span className="block text-success">{claimableAmount.toLocaleString()} claimable</span>
                      )}
                      {claimedAmount > 0 && (
                        <span className="block text-muted">{claimedAmount.toLocaleString()} claimed</span>
                      )}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
