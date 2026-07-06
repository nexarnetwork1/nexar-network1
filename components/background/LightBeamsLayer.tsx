"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

const beams = [
  { left: "8%", delay: 0, duration: 14, opacity: 0.12 },
  { left: "28%", delay: 2.5, duration: 18, opacity: 0.08 },
  { left: "52%", delay: 1, duration: 16, opacity: 0.1 },
  { left: "74%", delay: 3.5, duration: 20, opacity: 0.07 },
  { left: "91%", delay: 0.8, duration: 15, opacity: 0.09 },
];

export function LightBeamsLayer() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {beams.map((beam, index) => (
        <motion.div
          key={index}
          aria-hidden="true"
          className="absolute top-[-10%] h-[130%] w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent"
          style={{
            left: beam.left,
            opacity: beam.opacity,
            filter: "blur(0.5px)",
          }}
          animate={
            reducedMotion
              ? undefined
              : {
                  opacity: [beam.opacity * 0.5, beam.opacity, beam.opacity * 0.4],
                  scaleY: [0.85, 1.05, 0.9],
                }
          }
          transition={{
            duration: beam.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: beam.delay,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/60" />
    </div>
  );
}
