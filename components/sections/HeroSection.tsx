"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import gsap from "gsap";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { SITE } from "@/lib/constants/site";
import { ConnectWalletButton } from "@/components/web3/ConnectWalletButton";
import { BuyNxrButton } from "@/components/web3/BuyNxrButton";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { BlockchainVisualization } from "@/components/hero/BlockchainVisualization";
import { ScrollIndicator } from "@/components/hero/ScrollIndicator";
import { HeroCounters } from "@/components/hero/HeroCounters";
import { PresaleInfo } from "@/components/web3/PresaleInfo";
import { StatusDot } from "@/components/ui/StatusDot";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const contentY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const vizY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  useEffect(() => {
    if (reducedMotion || !headlineRef.current) return;

    const words = headlineRef.current.querySelectorAll(".hero-word");
    gsap.fromTo(
      words,
      { y: 80, opacity: 0, rotateX: -40 },
      {
        y: 0,
        opacity: 1,
        rotateX: 0,
        duration: 1,
        stagger: 0.06,
        ease: "power3.out",
        delay: 0.2,
      },
    );
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative flex min-h-[calc(100vh-var(--nxr-nav-height))] items-center overflow-hidden"
    >
      <Container className="relative py-12 sm:py-16 lg:py-24">
        <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
          <motion.div style={{ y: contentY, opacity }} className="relative z-10 order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mb-10 inline-flex items-center gap-3 rounded-full border border-border/80 bg-surface/50 px-4 py-2 backdrop-blur-xl"
            >
              <span className="relative flex h-2 w-2">
                <StatusDot color="gold" size="sm" />
              </span>
              <span className="text-[11px] tracking-[0.2em] text-muted uppercase">
                {SITE.blockchain}
              </span>
              <span className="h-3 w-px bg-border" />
              <span className="inline-flex items-center gap-1.5 text-[11px] text-gold-secondary">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified Contract
              </span>
            </motion.div>

            <h1
              ref={headlineRef}
              className="font-heading text-[clamp(2rem,6.5vw,5.5rem)] leading-[0.92] font-semibold tracking-[-0.04em]"
              style={{ perspective: "800px" }}
            >
              <span className="hero-word inline-block">The</span>{" "}
              <span className="hero-word inline-block">infrastructure</span>
              <br />
              <span className="hero-word inline-block">for</span>{" "}
              <span className="hero-word inline-block text-gradient-gold">
                global
              </span>
              <br />
              <span className="hero-word inline-block text-gradient-gold">
                payments
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 max-w-lg text-base sm:text-lg leading-7 sm:leading-8 text-muted"
            >
              {SITE.tagline} Sovereign blockchain payment rails — starting on
              BNB Smart Chain, evolving into Nexar Chain.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 flex flex-wrap items-center gap-2 sm:gap-3"
            >
              <ConnectWalletButton size="lg" magnetic glow />
              <BuyNxrButton />
              <Link href="#whitepaper">
                <Button size="lg" variant="outline" magnetic>
                  Whitepaper
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mt-14 space-y-6"
            >
              <HeroCounters />
              <PresaleInfo compact />
            </motion.div>
          </motion.div>

          <motion.div
            style={{ y: vizY }}
            className="relative mx-auto aspect-square w-full max-w-[400px] sm:max-w-[520px] lg:max-w-none order-1 lg:order-2"
          >
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.04)_0%,transparent_70%)] blur-2xl" />
            <BlockchainVisualization />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ScrollIndicator />
        </motion.div>
      </Container>
    </section>
  );
}
