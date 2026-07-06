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
    <div className="luxury-border rounded-2xl bg-card/40 px-6 py-5 backdrop-blur-md">
      <p className="text-[10px] tracking-[0.22em] text-muted uppercase">{label}</p>
      <p className="mt-2 font-mono text-2xl font-medium text-white sm:text-3xl">
        {children}
      </p>
    </div>
  );
}

export function HeroCounters() {
  const { web3Ready, soldAmount } = usePresaleData();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      <StatItem label="Ticker">
        <span>{SITE.ticker}</span>
      </StatItem>
      <StatItem label="Max Supply">
        <AnimatedCounter value={MAX_SUPPLY / 1_000_000} suffix="M" enabled />
      </StatItem>
      <StatItem label="Presale Sold">
        {web3Ready && soldAmount > 0 ? (
          <AnimatedCounter
            value={Math.round(soldAmount / 1_000_000)}
            suffix="M"
            enabled
          />
        ) : (
          <span>—</span>
        )}
      </StatItem>
      <StatItem label="Network">
        <span className="text-lg sm:text-2xl">BEP20</span>
      </StatItem>
    </div>
  );
}
