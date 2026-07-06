"use client";

import { motion } from "framer-motion";
import { SECURITY_ITEMS } from "@/lib/data/security";
import { CONTRACTS } from "@/lib/constants/site";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { Reveal } from "@/components/ui/Reveal";

export function SecuritySection() {
  return (
    <section id="security" className="section-padding relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      <Container>
        <Reveal className="mb-16">
          <SectionHeading
            eyebrow="Security"
            title="Trust through transparency"
            description="Every contract is verified, every allocation is published, and every vesting schedule is enforced on-chain."
            align="center"
          />
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2">
          {SECURITY_ITEMS.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.08}>
              <GlassCard hover className="group h-full !p-8">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/15 bg-gold/5"
                >
                  <item.icon className="h-6 w-6 text-gold" />
                </motion.div>
                <h3 className="font-heading text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{item.description}</p>
                <div className="mt-6 h-px w-12 bg-gradient-to-r from-gold/40 to-transparent transition-all duration-500 group-hover:w-full" />
              </GlassCard>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12">
          <div className="luxury-border rounded-2xl bg-card/30 p-8 backdrop-blur-xl">
            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <p className="text-[10px] tracking-[0.2em] text-muted uppercase">
                  Token Contract
                </p>
                <a
                  href={`https://bscscan.com/address/${CONTRACTS.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block font-mono text-xs text-gold transition-colors hover:text-gold-secondary"
                >
                  {CONTRACTS.token}
                </a>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.2em] text-muted uppercase">
                  Presale Contract
                </p>
                <a
                  href={`https://bscscan.com/address/${CONTRACTS.presale}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block font-mono text-xs text-gold transition-colors hover:text-gold-secondary"
                >
                  {CONTRACTS.presale}
                </a>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.2em] text-muted uppercase">
                  Verification
                </p>
                <p className="mt-2 text-sm text-emerald-400">Source Verified on BscScan</p>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
