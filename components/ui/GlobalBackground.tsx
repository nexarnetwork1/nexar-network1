"use client";

import { NoiseLayer } from "@/components/background/NoiseLayer";
import { cn } from "@/lib/utils/cn";

type GlobalBackgroundProps = {
  variant?: "home" | "marketplace" | "presale" | "login" | "default";
  className?: string;
};

/**
 * Official Nexar matte-black stage — true black base, subtle depth, no neon washes.
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
          "pointer-events-none fixed inset-0 -z-30 overflow-hidden bg-background",
          className,
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background-secondary" />

        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-overlay dark:opacity-[0.045]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "180px 180px",
          }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_65%_at_50%_35%,transparent_0%,rgba(0,0,0,0.35)_100%)] dark:bg-[radial-gradient(ellipse_75%_65%_at_50%_35%,transparent_0%,rgba(0,0,0,0.45)_100%)]" />
      </div>
      <NoiseLayer />
    </>
  );
}
