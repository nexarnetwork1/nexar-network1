"use client";

import Link from "next/link";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { SITE } from "@/lib/constants/site";
import { MAX_SUPPLY } from "@/lib/data/tokenomics";
import { usePresaleData } from "@/lib/web3/hooks/usePresaleData";

type StatItemProps = {
  label: string;
  children: React.ReactNode;
};

function StatItem({ label, children }: StatItemProps) {
  return (
    <div className="luxury-border rounded-2xl bg-card/40 px-5 py-4 backdrop-blur-md sm:px-6 sm:py-5">
      <p className="text-[10px] tracking-[0.22em] text-muted uppercase">{label}</p>
      <p className="mt-2 font-mono text-xl font-medium text-white sm:text-2xl">{children}</p>
    </div>
  );
}

export function HeroCounters() {
  const { soldAmount, capAmount, progress, status, isLoading } = usePresaleData();

  const presaleDisplay = (() => {
    if (isLoading) return <span className="opacity-40">…</span>;
    if (status === "upcoming") return <span className="text-amber-400">Upcoming</span>;
    if (status === "sold_out") return <span className="text-red-400">Sold Out</span>;
    if (status === "ended") return <span>Ended</span>;
    if (soldAmount > 0) {
      return (
        <Link href="/presale" className="hover:text-gold">
          <AnimatedCounter
            value={soldAmount >= 1_000_000 ? Math.round(soldAmount / 1_000_000) : Math.round(soldAmount)}
            suffix={soldAmount >= 1_000_000 ? "M" : ""}
            enabled
          />
          <span className="ml-1 text-xs text-muted">({progress.toFixed(0)}%)</span>
        </Link>
      );
    }
    return (
      <Link href="/presale" className="text-emerald-400 hover:underline">
        Live · 0 sold
      </Link>
    );
  })();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      <StatItem label="Ticker">
        <span>{SITE.ticker}</span>
      </StatItem>
      <StatItem label="Max Supply">
        <AnimatedCounter value={MAX_SUPPLY / 1_000_000} suffix="M" enabled />
      </StatItem>
      <StatItem label="Presale">
        {presaleDisplay}
      </StatItem>
      <StatItem label="Hard Cap">
        {capAmount > 0 ? (
          <AnimatedCounter value={Math.round(capAmount / 1_000_000)} suffix="M" enabled />
        ) : (
          "—"
        )}
      </StatItem>
    </div>
  );
}
