"use client";

import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils/cn";

type AnimatedCounterProps = {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
  enabled?: boolean;
};

function formatNumber(num: number, decimals: number): string {
  if (decimals > 0) return num.toFixed(decimals);
  return Math.round(num).toLocaleString("en-US");
}

export function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
  duration = 2200,
  className,
  enabled = true,
}: AnimatedCounterProps) {
  const count = useCountUp({ end: value, duration, decimals, enabled });

  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      {formatNumber(count, decimals)}
      {suffix}
    </span>
  );
}
