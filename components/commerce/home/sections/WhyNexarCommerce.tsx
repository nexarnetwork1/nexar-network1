"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Coins,
  Gauge,
  Shield,
  Zap,
} from "lucide-react";
import { SectionShell } from "@/components/commerce/home/shared/SectionShell";
import { cn } from "@/lib/utils/cn";

const FEATURES = [
  {
    id: "merchant",
    icon: Building2,
    title: "Merchant ecosystem",
    description:
      "Onboard verified merchants with storefronts, branding, subscriptions, and enterprise-grade operational tooling.",
  },
  {
    id: "crypto",
    icon: Coins,
    title: "Crypto ecosystem",
    description:
      "Native NXR and stablecoin checkout with treasury-grade settlement flows across the Nexar Network.",
  },
  {
    id: "settlement",
    icon: Gauge,
    title: "Fast settlement",
    description:
      "Orders, payments, and analytics roll up in realtime — merchants see revenue the moment transactions confirm.",
  },
  {
    id: "fees",
    icon: Zap,
    title: "Low fees",
    description:
      "Database-driven fee schedules keep platform economics transparent and competitive for global merchants.",
  },
  {
    id: "security",
    icon: Shield,
    title: "Security",
    description:
      "Row-level security, verified store pipeline, and audit-grade activity feeds protect every commerce interaction.",
  },
];

export function WhyNexarCommerce() {
  const [active, setActive] = useState(FEATURES[0].id);
  const current = FEATURES.find((f) => f.id === active) ?? FEATURES[0];

  return (
    <SectionShell
      eyebrow="Platform"
      title="Why Nexar Commerce"
      description="A premium enterprise stack designed for merchants who need performance, trust, and crypto-native payments in one platform."
    >
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <button
                key={feature.id}
                type="button"
                onClick={() => setActive(feature.id)}
                className={cn(
                  "flex w-full items-start gap-4 rounded-2xl border px-5 py-4 text-left transition-all",
                  active === feature.id
                    ? "border-gold/35 bg-gold/5"
                    : "border-border/60 bg-card/30 hover:border-gold/20",
                )}
              >
                <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-surface/80 text-gold">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-heading text-sm font-medium text-white">
                    {feature.title}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted">
                    {feature.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-card/70 via-surface/40 to-background p-8 sm:p-10"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gold/[0.06] blur-3xl" />
          <current.icon className="mb-6 h-10 w-10 text-gold" />
          <h3 className="font-heading text-2xl font-semibold text-white">{current.title}</h3>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-muted">
            {current.description}
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {["Verified pipeline", "Live analytics", "Global reach", "Enterprise SLA"].map(
              (item) => (
                <div
                  key={item}
                  className="rounded-xl border border-border/60 bg-background/40 px-4 py-3 text-sm text-white/90"
                >
                  {item}
                </div>
              ),
            )}
          </div>
        </motion.div>
      </div>
    </SectionShell>
  );
}
