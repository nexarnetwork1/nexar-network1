"use client";

import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

export function MouseGlowLayer() {
  const reducedMotion = usePrefersReducedMotion();

  if (reducedMotion) return null;

  return null;
}
