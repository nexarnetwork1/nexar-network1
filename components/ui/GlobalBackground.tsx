"use client";

import { NoiseLayer } from "@/components/background/NoiseLayer";
import { cn } from "@/lib/utils/cn";

type GlobalBackgroundProps = {
  variant?: "home" | "marketplace" | "presale" | "login" | "default";
  className?: string;
};

/**
 * Page canvas backdrop — follows light/dark canvas tokens only.
 * UI chrome, cards, and brand surfaces stay on fixed premium dark tokens.
 */
export function GlobalBackground({
  variant = "default",
  className,
}: GlobalBackgroundProps) {
  void variant;

  return (
    <>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none fixed inset-0 -z-30 overflow-hidden bg-canvas",
          className,
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--nxr-canvas-primary)] via-[var(--nxr-canvas-primary)] to-[var(--nxr-canvas-secondary)]" />

        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "180px 180px",
          }}
        />
      </div>
      <NoiseLayer />
    </>
  );
}
