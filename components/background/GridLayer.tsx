"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

export function GridLayer() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-x-0 bottom-0 h-[65%] [mask-image:linear-gradient(to_top,black,transparent)]">
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 origin-bottom"
          style={{
            backgroundImage: `
              linear-gradient(rgba(212,175,55,0.07) 1px, transparent 1px),
              linear-gradient(90deg, rgba(212,175,55,0.07) 1px, transparent 1px)
            `,
            backgroundSize: "72px 72px",
            transform: "perspective(900px) rotateX(68deg)",
          }}
          animate={reducedMotion ? undefined : { backgroundPosition: ["0px 0px", "0px 72px"] }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
    </div>
  );
}
