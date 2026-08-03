"use client";

import { NoiseLayer } from "@/components/background/NoiseLayer";
import { cn } from "@/lib/utils/cn";

type GlobalBackgroundProps = {
  variant?: "home" | "marketplace" | "presale" | "login" | "default";
  className?: string;
};

/**
 * Official Nexar matte-black stage: charcoal depth, soft studio gold light,
 * fine grain — no stars, no grid, no neon crypto washes.
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
          "pointer-events-none fixed inset-0 -z-30 overflow-hidden bg-[#050505]",
          className,
        )}
      >
        {/* Soft vertical studio falloff */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c0c0c] via-[#050505] to-[#030303]" />

        {/* Warm key light — top center, very soft */}
        <div className="absolute left-1/2 top-[-18%] h-[55vh] w-[90vw] -translate-x-1/2 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.07)_0%,transparent_68%)]" />

        {/* Subtle side fill */}
        <div className="absolute -left-[20%] top-[35%] h-[40vh] w-[45vw] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.035)_0%,transparent_70%)] blur-2xl" />
        <div className="absolute -right-[15%] top-[20%] h-[35vh] w-[40vw] rounded-full bg-[radial-gradient(circle,rgba(200,155,60,0.03)_0%,transparent_70%)] blur-2xl" />

        {/* Fine paper / leather grain via CSS (no canvas) */}
        <div
          className="absolute inset-0 opacity-[0.045] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "180px 180px",
          }}
        />

        {/* Soft vignette — boutique depth, not space */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_65%_at_50%_35%,transparent_0%,rgba(0,0,0,0.45)_100%)]" />
      </div>
      <NoiseLayer />
    </>
  );
}
