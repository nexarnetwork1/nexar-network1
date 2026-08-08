"use client";

import Link from "next/link";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { SITE } from "@/lib/constants/site";
import { MAX_SUPPLY } from "@/lib/data/tokenomics";
import { usePresaleData } from "@/lib/web3/hooks/usePresaleData";
import { getPresaleDisplayMetrics } from "@/lib/web3/presale-display";

type StatItemProps = {
  label: string;
  children: React.ReactNode;
};

function StatItem({ label, children }: StatItemProps) {
  return (
    <div className="luxury-border rounded-2xl bg-card/60 px-5 py-4 backdrop-blur-md sm:px-6 sm:py-5">
      <p className="text-[10px] tracking-[0.22em] text-muted uppercase">{label}</p>
      <p className="mt-2 font-mono text-xl font-medium text-white sm:text-2xl">{children}</p>
    </div>
  );
}

export function HeroCounters() {
  const { soldAmount, progress: chainProgress, status, isLoading } = usePresaleData();
  const { capAmount, progress } = getPresaleDisplayMetrics(soldAmount);

  const presaleDisplay = (() => {
    if (isLoading) return <span className="opacity-40">…</span>;
    if (status === "upcoming") return <span className="text-gold">Upcoming</span>;
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
          <span className="ml-1 text-xs text-muted">({(capAmount > 0 ? progress : chainProgress).toFixed(0)}%)</span>
        </Link>
      );
    }
    return (
      <Link href="/presale" className="text-success hover:underline">
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
        <AnimatedCounter value={100} suffix="M" enabled />
      </StatItem>
    </div>
  );
}
