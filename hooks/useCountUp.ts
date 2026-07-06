"use client";

import { useEffect, useRef, useState } from "react";

type UseCountUpOptions = {
  end: number;
  duration?: number;
  decimals?: number;
  start?: number;
  enabled?: boolean;
};

export function useCountUp({
  end,
  duration = 2000,
  decimals = 0,
  start = 0,
  enabled = true,
}: UseCountUpOptions): number {
  const [value, setValue] = useState(enabled ? start : end);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    startTimeRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(start + (end - start) * eased);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameRef.current);
  }, [end, duration, start, enabled]);

  const display = enabled ? value : end;
  return Number(display.toFixed(decimals));
}
