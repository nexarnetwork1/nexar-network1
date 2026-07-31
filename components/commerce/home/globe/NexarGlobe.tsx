"use client";

import dynamic from "next/dynamic";
import { usePrefersReducedMotion, useMediaQuery } from "@/hooks/useMediaQuery";
import type { CommerceActivityEvent } from "@/lib/commerce/types";

const GlobeCanvas = dynamic(
  () => import("./GlobeCanvas").then((m) => m.GlobeCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[320px] w-full items-center justify-center rounded-3xl border border-border/60 bg-card/30">
        <div className="h-48 w-48 animate-pulse rounded-full border border-gold/20 bg-surface/50" />
      </div>
    ),
  },
);

type NexarGlobeProps = {
  countryCodes: string[];
  activity: CommerceActivityEvent[];
  className?: string;
  compact?: boolean;
};

export function NexarGlobe({
  countryCodes,
  activity,
  className,
  compact = false,
}: NexarGlobeProps) {
  const reducedMotion = usePrefersReducedMotion();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const useCompact = compact || isMobile || isTablet;

  if (reducedMotion) {
    return (
      <div
        className={`flex h-full min-h-[280px] items-center justify-center rounded-3xl border border-border/60 bg-card/20 ${className ?? ""}`}
      >
        <div className="text-center">
          <div className="mx-auto mb-4 h-32 w-32 rounded-full border-2 border-gold/30 bg-gradient-to-br from-surface to-card" />
          <p className="text-sm text-muted">Nexar Network — {countryCodes.length} active regions</p>
        </div>
      </div>
    );
  }

  return (
    <GlobeCanvas
      countryCodes={countryCodes}
      activity={activity}
      className={className}
      compact={useCompact}
    />
  );
}
