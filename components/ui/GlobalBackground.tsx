"use client";

import { BackgroundEffect } from "@/components/background/BackgroundEffect";
import { cn } from "@/lib/utils/cn";

type GlobalBackgroundProps = {
  variant?: "home" | "marketplace" | "presale" | "login" | "default";
  className?: string;
};

const VARIANT_GRADIENTS = {
  home: "from-gold/[0.04] via-transparent to-emerald-500/[0.025]",
  marketplace: "from-violet-500/[0.05] via-transparent to-gold/[0.03]",
  presale: "from-amber-500/[0.05] via-transparent to-gold/[0.035]",
  login: "from-gold/[0.06] via-blue-500/[0.04] to-violet-500/[0.03]",
  default: "from-white/[0.025] via-transparent to-gold/[0.025]",
} as const;

/**
 * Site-wide futuristic neon blockchain background.
 * Used once in the root layout so every page shares the same visual system.
 */
export function GlobalBackground({
  variant = "default",
  className,
}: GlobalBackgroundProps) {
  return (
    <>
      <BackgroundEffect />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none fixed inset-0 -z-[1] overflow-hidden",
          className
        )}
      >
        <div className={cn("absolute inset-0 bg-gradient-to-br", VARIANT_GRADIENTS[variant])} />
        <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-gold/10 blur-[120px]" />
        <div className="absolute -right-24 bottom-1/4 h-64 w-64 rounded-full bg-violet-500/8 blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-[140px]" />
      </div>
    </>
  );
}
