"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

export function ScrollIndicator() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <motion.a
      href="#about"
      aria-label="Scroll to about section"
      className="group flex flex-col items-center gap-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.8 }}
    >
      <span className="text-[10px] tracking-[0.3em] text-muted uppercase transition-colors group-hover:text-gold">
        Explore
      </span>
      <motion.div
        animate={reducedMotion ? undefined : { y: [0, 6, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-10 w-6 items-start justify-center rounded-full border border-border pt-2 transition-colors group-hover:border-gold/30"
      >
        <ChevronDown className="h-3 w-3 text-muted transition-colors group-hover:text-gold" />
      </motion.div>
    </motion.a>
  );
}
