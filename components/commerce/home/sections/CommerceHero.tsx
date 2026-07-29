"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Globe2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { StatusDot } from "@/components/ui/StatusDot";
import { NexarGlobe } from "@/components/commerce/home/globe/NexarGlobe";
import type { CommerceActivityEvent } from "@/lib/commerce/types";

type CommerceHeroProps = {
  countryCodes: string[];
  activity: CommerceActivityEvent[];
};

export function CommerceHero({ countryCodes, activity }: CommerceHeroProps) {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-12 sm:pb-20 lg:pb-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gold/[0.04] blur-3xl" />
        <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-gold/[0.03] blur-3xl" />
      </div>

      <Container className="relative">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-border/80 bg-surface/50 px-4 py-2 backdrop-blur-xl">
              <StatusDot color="gold" size="sm" />
              <span className="text-[11px] tracking-[0.2em] text-muted uppercase">
                Nexar Commerce
              </span>
              <span className="h-3 w-px bg-border" />
              <span className="inline-flex items-center gap-1.5 text-[11px] text-gold-secondary">
                <Globe2 className="h-3.5 w-3.5" />
                Global Network Live
              </span>
            </div>

            <h1 className="font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-[4.25rem]">
              Enterprise commerce
              <span className="mt-2 block text-gradient-gold">built for the Nexar Network</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Launch, scale, and settle globally with a premium merchant platform powered by
              real-time analytics, verified brands, and native crypto payments across the Nexar
              ecosystem.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/auth/register?role=merchant"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-gold/30 bg-gold px-7 text-sm font-medium tracking-wide text-background shadow-[0_0_30px_-8px_rgba(212,175,55,0.55)] transition-all hover:bg-gold-secondary hover:shadow-[0_0_40px_-6px_rgba(212,175,55,0.7)]"
              >
                Start Selling
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Button
                size="lg"
                variant="secondary"
                magnetic
                onClick={() =>
                  document.getElementById("commerce-stats")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                <Sparkles className="h-4 w-4" />
                Explore Marketplace
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <NexarGlobe countryCodes={countryCodes} activity={activity} />
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
