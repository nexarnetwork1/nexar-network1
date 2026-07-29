"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Code2, Package, Puzzle } from "lucide-react";
import { COMMERCE_API_V1, MARKETPLACE_API_V1 } from "@/modules/marketplace/shared/constants";
import { SectionShell } from "@/components/commerce/home/shared/SectionShell";

const RESOURCES = [
  {
    icon: Code2,
    title: "Commerce API",
    description: "REST endpoints for statistics, brands, analytics, and activity feeds.",
    href: `${COMMERCE_API_V1}/health`,
    cta: "API health",
  },
  {
    icon: Package,
    title: "Catalog SDK",
    description: "Marketplace catalog, search, and product APIs for storefront integrations.",
    href: `${MARKETPLACE_API_V1}/catalog/products`,
    cta: "Browse catalog API",
  },
  {
    icon: BookOpen,
    title: "Documentation",
    description: "Architecture guides, deployment docs, and integration references.",
    href: "/whitepaper",
    cta: "Read docs",
  },
  {
    icon: Puzzle,
    title: "Future apps",
    description: "Checkout widgets, merchant dashboards, and partner app marketplace.",
    href: "/marketplace",
    cta: "Coming soon",
  },
];

export function DeveloperPlatform() {
  return (
    <SectionShell
      eyebrow="Developers"
      title="Developer platform"
      description="Build on Nexar Commerce with versioned APIs, catalog endpoints, and an extensible architecture for future apps."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {RESOURCES.map((resource, i) => {
          const Icon = resource.icon;
          return (
            <motion.div
              key={resource.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-border/70 bg-card/40 p-6 backdrop-blur-md transition-colors hover:border-gold/25"
            >
              <Icon className="mb-4 h-8 w-8 text-gold" />
              <h3 className="font-heading text-lg font-medium text-white">{resource.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{resource.description}</p>
              <Link
                href={resource.href}
                className="mt-5 inline-flex text-sm font-medium text-gold transition-colors hover:text-gold-secondary"
              >
                {resource.cta} →
              </Link>
            </motion.div>
          );
        })}
      </div>
    </SectionShell>
  );
}
