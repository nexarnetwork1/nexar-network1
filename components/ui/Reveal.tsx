"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { ANIMATION } from "@/lib/constants/design";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils/cn";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  duration?: number;
};

const directionOffset = {
  up: { y: 40, x: 0 },
  down: { y: -40, x: 0 },
  left: { x: 40, y: 0 },
  right: { x: -40, y: 0 },
  none: { x: 0, y: 0 },
};

export function Reveal({
  children,
  className,
  delay = 0,
  direction = "up",
  duration = 0.8,
}: RevealProps) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });
  const reducedMotion = usePrefersReducedMotion();
  const offset = directionOffset[direction];

  // Respect prefers-reduced-motion: skip animations entirely
  if (reducedMotion) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...offset }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...offset }}
      transition={{
        duration,
        delay,
        ease: ANIMATION.ease,
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
