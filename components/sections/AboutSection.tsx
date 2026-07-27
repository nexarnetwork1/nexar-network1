"use client";

import { motion } from "framer-motion";
import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Globe, Layers, Shield } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { Reveal } from "@/components/ui/Reveal";
import { SITE } from "@/lib/constants/site";
import { MAX_SUPPLY } from "@/lib/data/tokenomics";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

gsap.registerPlugin(ScrollTrigger);

const STATS = [
  { label: "Max Supply", value: MAX_SUPPLY / 1_000_000, suffix: "M" },
  { label: "Decimals", value: SITE.decimals, suffix: "" },
  { label: "Ecosystem Modules", value: 7, suffix: "" },
  { label: "Mint Status", value: 0, suffix: "", display: "Disabled" },
];

export function AboutSection() {
  const graphicRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion || !graphicRef.current) return;

    const rings = graphicRef.current.querySelectorAll(".about-ring");

    const ctx = gsap.context(() => {
      gsap.to(rings, {
        rotation: 360,
        duration: 30,
        repeat: -1,
        ease: "none",
        stagger: 0.5,
      });

      gsap.from(".about-stat", {
        scrollTrigger: {
          trigger: graphicRef.current,
          start: "top 75%",
        },
        scale: 0.8,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "back.out(1.4)",
      });
    });

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section id="about" className="section-padding relative scroll-mt-[var(--nxr-header-offset)]">
      <Container>
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <SectionHeading
              eyebrow="About Nexar"
              title="Building sovereign payment infrastructure"
              description="Nexar Network is not a meme token or a template project. We are engineering enterprise-grade decentralized payment rails — from BNB Smart Chain today to a purpose-built Nexar Chain tomorrow."
            />

            <div className="mt-10 space-y-6">
              {[
                {
                  icon: Globe,
                  title: "Global Reach",
                  text: "Cross-border settlement designed for merchants, enterprises, and communities worldwide.",
                },
                {
                  icon: Shield,
                  title: "Verified & Transparent",
                  text: "Contracts verified on BscScan. Mint disabled forever. Full tokenomics published.",
                },
                {
                  icon: Layers,
                  title: "Full Ecosystem",
                  text: "Wallet, Pay, Explorer, Bridge, Launchpad, and Developer API — all connected.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  className="flex gap-4"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card/60">
                    <item.icon className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted">{item.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Reveal>

          <div ref={graphicRef} className="relative flex items-center justify-center">
            <div className="relative aspect-square w-full max-w-md">
              <div className="about-ring absolute inset-0 rounded-full border border-gold/10" />
              <div className="about-ring absolute inset-[8%] rounded-full border border-white/5" style={{ animationDirection: "reverse" }} />
              <div className="about-ring absolute inset-[16%] rounded-full border border-gold/5" />

              <div className="absolute inset-[22%] rounded-full bg-gradient-to-br from-gold/10 via-transparent to-transparent backdrop-blur-sm" />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="font-heading text-5xl font-semibold text-gradient-gold">
                    {SITE.ticker}
                  </p>
                  <p className="mt-2 text-xs tracking-[0.2em] text-muted uppercase">
                    {SITE.blockchain}
                  </p>
                </div>
              </div>

              <div className="absolute -right-4 top-1/4 about-stat luxury-border rounded-xl bg-card/60 px-4 py-3 backdrop-blur-md">
                <p className="text-[10px] tracking-wide text-muted uppercase">Supply</p>
                <p className="font-mono text-lg text-white">
                  <AnimatedCounter value={MAX_SUPPLY / 1_000_000} suffix="M" />
                </p>
              </div>

              <div className="absolute -left-4 bottom-1/4 about-stat luxury-border rounded-xl bg-card/60 px-4 py-3 backdrop-blur-md">
                <p className="text-[10px] tracking-wide text-muted uppercase">NXR</p>
                <p className="text-sm font-medium text-white">{SITE.ticker}</p>
              </div>

              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 about-stat luxury-border rounded-xl bg-card/60 px-4 py-3 backdrop-blur-md">
                <p className="text-[10px] tracking-wide text-muted uppercase">Modules</p>
                <p className="font-mono text-lg text-gold">
                  <AnimatedCounter value={7} />
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {STATS.map((stat) => (
            <Reveal key={stat.label} delay={0.05}>
              <div className="border-t border-border pt-6">
                <p className="text-[10px] tracking-[0.2em] text-muted uppercase">
                  {stat.label}
                </p>
                <p className="mt-2 font-mono text-2xl text-white">
                  {stat.display ?? (
                    <>
                      <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    </>
                  )}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
