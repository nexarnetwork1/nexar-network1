"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { FaLinkedin } from "react-icons/fa6";
import { FOUNDER } from "@/lib/data/founder";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { Reveal } from "@/components/ui/Reveal";

const SOCIAL_LINKS = [
  { href: FOUNDER.linkedin, icon: FaLinkedin, label: "LinkedIn" },
];

export function FounderSection() {
  return (
    <section id="founder" className="section-padding relative scroll-mt-[var(--nxr-header-offset)] overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/15 to-transparent" />

      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.85fr)_1.15fr] lg:gap-16">
          <Reveal>
            <div className="relative mx-auto flex w-full max-w-[280px] flex-col items-center lg:max-w-[320px]">
              <div className="relative aspect-square w-full max-w-[280px] overflow-hidden rounded-full border border-border bg-card p-1 shadow-[var(--nxr-shadow-soft)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/founder.jpg"
                  alt={`${FOUNDER.name}, ${FOUNDER.role}`}
                  width={320}
                  height={320}
                  className="h-full w-full rounded-full object-cover object-[center_18%]"
                  loading="eager"
                />
              </div>

              <div className="mt-6 text-center">
                <p className="font-heading text-xl font-semibold text-foreground">
                  {FOUNDER.name}
                </p>
                <p className="mt-1 text-xs tracking-[0.18em] text-gold uppercase">
                  {FOUNDER.role}
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35, duration: 0.4 }}
                className="absolute -bottom-2 right-2 rounded-xl border border-border bg-card/90 px-3 py-2 backdrop-blur-sm sm:right-4"
              >
                <Quote className="h-4 w-4 text-gold/70" />
              </motion.div>
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
              <blockquote className="mt-8 border-l-2 border-gold/30 pl-6">
                <p className="font-heading text-xl leading-9 text-foreground/90 italic">
                  &ldquo;{FOUNDER.quote}&rdquo;
                </p>
              </blockquote>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="mt-8 text-base leading-8 text-muted">
                {FOUNDER.bio}
              </p>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {FOUNDER.stats.map((stat) => (
                  <div key={stat.label} className="border-t border-border pt-4">
                    <p className="font-mono text-xl text-foreground">
                      {stat.value.match(/^\d/) ? (
                        <AnimatedCounter
                          value={parseInt(stat.value)}
                          suffix={stat.value.replace(/^\d+/, "")}
                        />
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
              <div className="mt-10">
                <p className="mb-4 text-xs tracking-[0.2em] text-muted uppercase">
                  Connect
                </p>
                <div className="flex flex-wrap gap-3">
                  {SOCIAL_LINKS.map(({ href, icon: Icon, label }) => (
                    <motion.a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2.5 text-sm font-medium transition-colors duration-200 hover:border-gold/30 hover:text-gold"
                      aria-label={`Connect with ${FOUNDER.name} on ${label}`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </motion.a>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
