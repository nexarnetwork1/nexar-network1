"use client";

import { cn } from "@/lib/utils/cn";

type MarketplaceArtworkProps = {
  className?: string;
};

/** Subtle marketplace-themed background artwork for auth and marketplace pages. */
export function MarketplaceArtwork({ className }: MarketplaceArtworkProps) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <svg className="absolute inset-0 h-full w-full opacity-[0.035]" viewBox="0 0 1200 800" fill="none">
        <path d="M120 620 L220 520 L320 560 L420 460 L520 500 L620 400 L720 440 L820 340 L920 380 L1020 280" stroke="#D4AF37" strokeWidth="1.2" />
        <rect x="180" y="500" width="90" height="110" rx="8" stroke="#8B5CF6" strokeWidth="1" />
        <rect x="420" y="430" width="110" height="130" rx="8" stroke="#D4AF37" strokeWidth="1" />
        <rect x="680" y="360" width="100" height="120" rx="8" stroke="#60A5FA" strokeWidth="1" />
        <circle cx="260" cy="560" r="28" stroke="#D4AF37" strokeWidth="1" />
        <circle cx="760" cy="420" r="34" stroke="#8B5CF6" strokeWidth="1" />
      </svg>
      <div className="absolute left-[8%] top-[18%] h-24 w-24 rounded-3xl border border-gold/10 bg-gold/5 blur-[1px]" />
      <div className="absolute right-[12%] top-[28%] h-32 w-32 rounded-full border border-violet-500/10 bg-violet-500/5" />
      <div className="absolute bottom-[16%] left-[34%] h-28 w-28 rotate-12 rounded-2xl border border-blue-500/10 bg-blue-500/5" />
    </div>
  );
}
