"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { FaLinkedin } from "react-icons/fa6";
import { FOUNDER } from "@/lib/data/founder";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { Reveal } from "@/components/ui/Reveal";

export function FounderSection() {
  return (
    <section id="founder" className="section-padding relative">
      <Container>
        <div className="grid items-center gap-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <Reveal>
            <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
              <div className="aspect-[3/4] overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-surface to-background">
                <div className="flex h-full flex-col items-center justify-center p-8">
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-gold/30 bg-gradient-to-br from-gold/10 to-transparent">
                    <span className="font-heading text-4xl font-semibold text-gradient-gold">
                      ME
                    </span>
                  </div>
                  <p className="mt-6 font-heading text-2xl font-semibold">{FOUNDER.name}</p>
                  <p className="mt-1 text-sm tracking-wide text-gold">{FOUNDER.role}</p>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 luxury-border rounded-2xl bg-card/80 px-5 py-4 backdrop-blur-xl">
                <Quote className="h-5 w-5 text-gold/60" />
              </div>
            </div>
          </Reveal>

          <div>
            <Reveal>
              <SectionHeading
                eyebrow="Founder"
                title="Led by vision, driven by purpose"
              />
            </Reveal>

            <Reveal delay={0.1}>
              <blockquote className="mt-8 border-l-2 border-gold/40 pl-6">
                <p className="font-heading text-xl leading-9 text-white/90 italic">
                  &ldquo;{FOUNDER.quote}&rdquo;
                </p>
              </blockquote>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="mt-8 text-base leading-8 text-muted">{FOUNDER.bio}</p>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {FOUNDER.stats.map((stat) => (
                  <div key={stat.label} className="border-t border-border pt-4">
                    <p className="font-mono text-xl text-white">
                      {stat.value.match(/^\d/) ? (
                        <AnimatedCounter value={parseInt(stat.value)} suffix={stat.value.replace(/^\d+/, "")} />
                      ) : (
                        stat.value
                      )}
                    </p>
                    <p className="mt-1 text-[10px] tracking-[0.15em] text-muted uppercase">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.4}>
              <motion.a
                href={FOUNDER.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                className="mt-10 inline-flex items-center gap-3 rounded-full border border-border bg-card/40 px-6 py-3 text-sm font-medium transition-colors hover:border-gold/30 hover:text-gold"
              >
                <FaLinkedin className="h-4 w-4" />
                Connect on LinkedIn
              </motion.a>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
