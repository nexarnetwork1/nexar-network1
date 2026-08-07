"use client";

import { cn } from "@/lib/utils/cn";

type PresaleArtworkProps = {
  className?: string;
};

export function PresaleArtwork({ className }: PresaleArtworkProps) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div className="absolute inset-0 opacity-[0.04]">
        <svg className="h-full w-full" viewBox="0 0 1200 800" fill="none">
          <circle cx="200" cy="180" r="120" stroke="#FFD15C" strokeWidth="1" />
          <circle cx="980" cy="220" r="90" stroke="#FFD15C" strokeWidth="0.8" opacity="0.5" />
          <circle cx="620" cy="620" r="140" stroke="#FFD15C" strokeWidth="0.8" opacity="0.35" />
          <path d="M120 400 C 300 280, 520 520, 720 360 S 980 460, 1080 320" stroke="#FFD15C" strokeWidth="1.2" />
          <path d="M80 520 C 260 420, 420 640, 640 500 S 920 560, 1120 460" stroke="#FFD15C" strokeWidth="0.8" opacity="0.4" />
        </svg>
      </div>
      <div className="absolute left-1/4 top-1/3 h-40 w-40 rounded-full bg-gold/5 blur-3xl" />
      <div className="absolute right-1/4 bottom-1/4 h-48 w-48 rounded-full bg-gold/[0.05] blur-3xl" />
    </div>
  );
}
