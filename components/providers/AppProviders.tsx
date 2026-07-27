"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { Web3Provider } from "@/components/providers/Web3Provider";

gsap.registerPlugin(ScrollTrigger);

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const html = document.documentElement;
    html.classList.add("lenis", "lenis-smooth");

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.2,
    });

    lenis.on("scroll", ScrollTrigger.update);

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.refresh();

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      html.classList.remove("lenis", "lenis-smooth");
      ScrollTrigger.refresh();
    };
  }, [reducedMotion]);

  return <Web3Provider>{children}</Web3Provider>;
}
