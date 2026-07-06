"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

export function AuroraLayer() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        aria-hidden="true"
        className="absolute -top-[30%] -left-[20%] h-[70vh] w-[70vw] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.14)_0%,transparent_70%)] blur-3xl"
        animate={
          reducedMotion
            ? undefined
            : {
                x: [0, 80, 20, 0],
                y: [0, 40, -20, 0],
                scale: [1, 1.08, 0.96, 1],
              }
        }
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute -top-[10%] -right-[15%] h-[55vh] w-[55vw] rounded-full bg-[radial-gradient(circle,rgba(245,227,158,0.08)_0%,transparent_68%)] blur-3xl"
        animate={
          reducedMotion
            ? undefined
            : {
                x: [0, -60, -10, 0],
                y: [0, 30, 60, 0],
                scale: [1, 0.94, 1.06, 1],
              }
        }
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute bottom-[-20%] left-[25%] h-[50vh] w-[50vw] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.06)_0%,transparent_72%)] blur-3xl"
        animate={
          reducedMotion
            ? undefined
            : {
                x: [0, 40, -30, 0],
                y: [0, -25, 15, 0],
              }
        }
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.05),transparent_55%)]" />
    </div>
  );
}
