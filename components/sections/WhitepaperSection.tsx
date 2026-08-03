"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, BookOpen, Download } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

const WHITEPAPER_SECTIONS = [
  "Executive Summary",
  "Industry Overview",
  "Current Challenges",
  "The Nexar Solution",
  "Vision",
  "Mission",
  "Core Values",
  "Why Nexar Network",
  "Market Opportunity",
  "Technology Overview",
  "Token Overview",
  "Tokenomics",
  "Team Vesting",
  "Token Utility",
  "Nexar Ecosystem",
  "Roadmap",
  "Security & Transparency",
  "Official Wallet Addresses",
  "Founder",
  "Legal Disclaimer",
  "Conclusion",
  "Nexar Marketplace",
];

export function WhitepaperSection() {
  return (
    <section id="whitepaper" className="section-padding relative scroll-mt-[var(--nxr-header-offset)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <SectionHeading
              eyebrow="Whitepaper"
              title="The complete Nexar vision"
              description="A comprehensive document covering architecture, tokenomics, ecosystem design, security model, and the path to sovereign chain infrastructure."
            />

            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/whitepaper">
                <Button size="lg" magnetic glow>
                  <BookOpen className="h-4 w-4" />
                  Read Online
                </Button>
              </Link>
              <a href="/whitepaper.pdf" download>
                <Button size="lg" variant="outline" magnetic>
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.4 }}
              className="luxury-border relative overflow-hidden rounded-3xl bg-gradient-to-br from-card/70 via-surface/60 to-background/70 p-8 backdrop-blur-xl"
            >
              <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gold/5 blur-3xl" />
              <div className="relative">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] tracking-[0.2em] text-muted uppercase">
                      Nexar Network
                    </p>
                    <h3 className="mt-1 font-heading text-2xl font-semibold">
                      Technical Whitepaper
                    </h3>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/20 bg-gold/5">
                    <BookOpen className="h-5 w-5 text-gold" />
                  </div>
                </div>

                <div className="space-y-2.5">
                  {WHITEPAPER_SECTIONS.map((section, i) => (
                    <motion.div
                      key={section}
                      initial={{ opacity: 0, x: 10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between rounded-lg border border-border/50 bg-background/40 px-4 py-2.5"
                    >
                      <span className="text-sm text-muted">{section}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-gold/40" />
                    </motion.div>
                  ))}
                </div>

                <p className="mt-6 text-center font-mono text-[10px] text-muted/50">
                  Version 1.0 · 2026
                </p>
              </div>
            </motion.div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
