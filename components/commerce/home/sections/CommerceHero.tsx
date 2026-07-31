"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles, Store, Users } from "lucide-react";
import Link from "next/link";
import { CommerceAuthTrigger } from "@/components/commerce/auth/NexarCommerceAuthProvider";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { StatusDot } from "@/components/ui/StatusDot";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";
import type { LiveMetricsPayload } from "@/lib/commerce/types";

const HeroEarthBackground = dynamic(
  () =>
    import("@/components/commerce/home/hero/HeroEarthBackground").then(
      (m) => m.HeroEarthBackground,
    ),
  { ssr: false },
);

type CommerceHeroProps = {
  initialMetrics: LiveMetricsPayload;
};

export function CommerceHero({ initialMetrics }: CommerceHeroProps) {
  const highlights = [
    {
      label: "Verified merchants",
      value: initialMetrics.total_merchants ?? 0,
      icon: Store,
    },
    {
      label: "Products listed",
      value: initialMetrics.total_products ?? 0,
      icon: Sparkles,
    },
    {
      label: "Countries active",
      value: initialMetrics.countries_active ?? 0,
      icon: Users,
    },
  ];

  return (
    <section className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pb-20">
      <HeroEarthBackground />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gold/[0.04] blur-3xl" />
        <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-gold/[0.03] blur-3xl" />
      </div>

      <Container className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-4xl text-center lg:max-w-5xl"
        >
          <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-border/80 bg-surface/50 px-4 py-2 backdrop-blur-xl">
            <StatusDot color="gold" size="sm" />
            <span className="text-[11px] tracking-[0.2em] text-muted uppercase">Nexar Commerce</span>
          </div>

          <h1 className="font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-[4.25rem]">
            The commerce platform
            <span className="mt-2 block text-gradient-gold">for the Nexar Network</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            One unified marketplace for verified merchants, global crypto payments, enterprise
            analytics, and AI-powered operations — built with Nexar black & gold identity.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={MARKETPLACE_ROUTES.root}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-gold/30 bg-gold px-7 text-sm font-medium tracking-wide text-background shadow-[0_0_30px_-8px_rgba(212,175,55,0.55)] transition-all hover:bg-gold-secondary"
            >
              Browse marketplace
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <CommerceAuthTrigger
              mode="register"
              role="merchant"
              className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-surface/70 px-7 text-sm font-medium text-white backdrop-blur-md transition-all hover:border-gold/30"
            >
              Start selling
            </CommerceAuthTrigger>
            <Button
              size="lg"
              variant="secondary"
              magnetic
              onClick={() =>
                document.getElementById("global-network")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Global network
            </Button>
          </div>

          <div className="mt-12 grid gap-3 sm:grid-cols-3">
            {highlights.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-2xl border border-border/60 bg-card/30 px-4 py-4 backdrop-blur-md"
              >
                <div className="mb-2 flex items-center justify-center gap-2 text-gold">
                  <Icon className="h-4 w-4" />
                  <span className="text-[10px] tracking-[0.18em] uppercase">{label}</span>
                </div>
                <p className="font-mono text-2xl text-white">{value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
