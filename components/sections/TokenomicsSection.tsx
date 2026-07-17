"use client";

import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { GlassCard } from "@/components/ui/GlassCard";
import { Reveal } from "@/components/ui/Reveal";
import { TOKENOMICS, MAX_SUPPLY } from "@/lib/data/tokenomics";
import { SITE } from "@/lib/constants/site";
import { cn } from "@/lib/utils/cn";

function AllocationRing() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });

  const size = 280;
  const stroke = 24;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const segments = useMemo(() => {
    return TOKENOMICS.map((item, index) => {
      const cumulative = TOKENOMICS.slice(0, index).reduce(
        (sum, entry) => sum + entry.percent,
        0,
      );
      const segmentLength = (item.percent / 100) * circumference;
      const offset = circumference - (cumulative / 100) * circumference;
      const delay = cumulative * 5;
      return { item, segmentLength, offset, delay };
    });
  }, [circumference]);

  return (
    <div ref={ref} className="relative mx-auto flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {segments.map(({ item, segmentLength, offset, delay }) => (
          <circle
            key={item.title}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={item.color}
            strokeWidth={stroke}
            strokeDasharray={`${inView ? segmentLength : 0} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="butt"
            className="transition-all duration-1000 ease-out"
            style={{ transitionDelay: `${delay}ms` }}
          />
        ))}
      </svg>
      <div className="absolute text-center">
        <p className="font-mono text-4xl font-semibold text-white">
          <AnimatedCounter value={MAX_SUPPLY / 1_000_000} suffix="M" enabled={inView} />
        </p>
        <p className="mt-1 text-xs tracking-[0.2em] text-muted uppercase">
          Total Supply
        </p>
      </div>
    </div>
  );
}

export function TokenomicsSection() {
  const barsRef = useRef<HTMLDivElement>(null);

  return (
    <section id="tokenomics" className="section-padding relative">
      <Container>
        <Reveal className="mb-12 sm:mb-16">
          <SectionHeading
            eyebrow="Tokenomics"
            title="Transparent allocation, fixed supply"
            description={`${SITE.ticker} has a maximum supply of ${SITE.maxSupply} tokens with mint permanently disabled. Every allocation is published and verifiable.`}
          />
        </Reveal>

        <div className="grid gap-8 sm:gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <Reveal>
            <AllocationRing />
            <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-2 sm:gap-3">
              {TOKENOMICS.map((item) => (
                <div key={item.title} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-muted">{item.title}</span>
                  <span className="ml-auto font-mono text-xs text-white">
                    {item.percent}%
                  </span>
                </div>
              ))}
            </div>
          </Reveal>

          <div ref={barsRef} className="space-y-3">
            {TOKENOMICS.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.05}>
                <GlassCard hover className="!p-5">
                  <div className="mb-3 flex items-baseline justify-between">
                    <h3 className="font-heading text-base font-semibold">{item.title}</h3>
                    <span className="font-mono text-sm text-gold">{item.percent}%</span>
                  </div>
                  <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-border">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${item.percent}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>
                      {(item.value / 1_000_000).toLocaleString()}M {SITE.ticker}
                    </span>
                    {item.vesting && (
                      <span className="text-[10px] text-gold-secondary/70">{item.vesting}</span>
                    )}
                  </div>
                </GlassCard>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal className="mt-12 sm:mt-16">
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
            {[
              { label: "Ticker", value: SITE.ticker },
              { label: "Decimals", value: String(SITE.decimals) },
              { label: "Mint", value: SITE.mint },
              { label: "Blockchain", value: "BSC" },
            ].map((item) => (
              <div key={item.label} className="border-t border-border pt-3 sm:pt-4">
                <p className="text-[10px] tracking-[0.2em] text-muted uppercase">
                  {item.label}
                </p>
                <p className={cn("mt-1 font-mono text-sm", item.label === "Mint" ? "text-gold" : "text-white")}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 sm:mt-8 text-center">
            <Link
              href="/market"
              className="inline-flex items-center gap-2 text-sm text-gold transition-colors hover:text-gold-secondary"
            >
              View All Official Contracts
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
