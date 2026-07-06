"use client";

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
      <p className="mt-2 font-mono text-xl font-medium text-white sm:text-2xl">
        {children}
      </p>
    </div>
  );
}

export function HeroCounters() {
  const { web3Ready, soldAmount, isLoading } = usePresaleData();

  // Format sold amount: show live data when available, otherwise static placeholder
  const soldDisplay = (() => {
    if (!web3Ready) return null;
    if (isLoading) return <span className="opacity-40">…</span>;
    if (soldAmount > 0) {
      return (
        <AnimatedCounter
          value={Math.round(soldAmount / 1_000_000)}
          suffix="M"
          enabled
        />
      );
    }
    return <span>Upcoming</span>;
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
        {soldDisplay ?? <span>Live Soon</span>}
      </StatItem>
      <StatItem label="Network">
        <span>BEP20</span>
      </StatItem>
    </div>
  );
}
