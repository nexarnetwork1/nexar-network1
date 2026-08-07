"use client";

import { useEffect, useRef } from "react";
import { useMousePosition } from "@/hooks/useMousePosition";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

export function MouseGlowLayer() {
  const { x, y } = useMousePosition();
  const reducedMotion = usePrefersReducedMotion();
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion || !glowRef.current) return;

    glowRef.current.style.transform = `translate(${x - 250}px, ${y - 250}px)`;
  }, [x, y, reducedMotion]);

  if (reducedMotion) return null;

  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[2] h-[500px] w-[500px] rounded-full opacity-40 transition-transform duration-150 ease-out will-change-transform"
      style={{
        background:
          "radial-gradient(circle, rgba(255,209,92,0.08) 0%, rgba(255,209,92,0.03) 35%, transparent 70%)",
      }}
    />
  );
}
