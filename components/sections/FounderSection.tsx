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
    <section id="founder" className="section-padding relative overflow-hidden">
      {/* Section divider */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      {/* Background glow */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(ellipse_at_left,rgba(212,175,55,0.04)_0%,transparent_60%)]" />

      <Container>
        <div className="grid items-center gap-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          {/* Photo column */}
          <Reveal>
            <div className="relative mx-auto w-full max-w-xs lg:max-w-none">
              {/* Outer glow ring */}
              <div className="absolute -inset-4 rounded-3xl bg-gold/5 blur-2xl" />

              {/* Card frame */}
              <div className="luxury-border relative overflow-hidden rounded-3xl bg-gradient-to-b from-card via-surface to-background">
                {/* Founder image - real photo */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/founder.jpg"
                  alt={`${FOUNDER.name}, ${FOUNDER.role}`}
                  width={400}
                  height={500}
                  className="h-auto w-full object-cover"
                  loading="eager"
                />

                {/* Name overlay at bottom of card */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 via-background/60 to-transparent p-6">
                  <p className="font-heading text-xl font-semibold text-white">
                    {FOUNDER.name}
                  </p>
                  <p className="mt-0.5 text-xs tracking-[0.18em] text-gold uppercase">
                    {FOUNDER.role}
                  </p>
                </div>
              </div>

              {/* Quote badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="absolute -bottom-5 -right-5 luxury-border rounded-2xl bg-card/80 px-4 py-3 backdrop-blur-xl"
              >
                <Quote className="h-5 w-5 text-gold/70" />
              </motion.div>
            </div>
          </Reveal>

          {/* Content column */}
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
              <p className="mt-8 text-base leading-8 text-muted">
                {FOUNDER.bio}
              </p>
            </Reveal>

            {/* Stats grid */}
            <Reveal delay={0.3}>
              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {FOUNDER.stats.map((stat) => (
                  <div key={stat.label} className="border-t border-border pt-4">
                    <p className="font-mono text-xl text-white">
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

            {/* Social Links */}
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
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-4 py-2.5 text-sm font-medium transition-all duration-300 hover:border-gold/30 hover:bg-card/70 hover:text-gold"
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
