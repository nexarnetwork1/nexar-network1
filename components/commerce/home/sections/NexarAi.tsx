"use client";

import { motion } from "framer-motion";
import { Bot, LineChart, Search, Sparkles, Wand2 } from "lucide-react";
import { SectionShell } from "@/components/commerce/home/shared/SectionShell";

const CAPABILITIES = [
  {
    icon: Wand2,
    title: "Product creation",
    description: "Generate catalog listings with structured attributes, variants, and media placeholders.",
  },
  {
    icon: Sparkles,
    title: "Descriptions",
    description: "Craft conversion-focused product copy aligned with your brand voice and category norms.",
  },
  {
    icon: Search,
    title: "SEO",
    description: "Optimize titles, slugs, and metadata for marketplace discovery and search ranking.",
  },
  {
    icon: LineChart,
    title: "Marketing",
    description: "Surface promotion opportunities, flash deals, and campaign-ready messaging.",
  },
  {
    icon: Bot,
    title: "Sales insights",
    description: "Interpret merchant analytics — revenue, conversions, and top products — into actionable guidance.",
  },
];

export function NexarAi() {
  return (
    <SectionShell
      eyebrow="Intelligence"
      title="Nexar AI"
      description="An AI assistant layer for merchants — product creation, SEO, marketing copy, and sales insights powered by your live commerce data."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {CAPABILITIES.map((cap, i) => {
          const Icon = cap.icon;
          return (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -5 }}
              className="group rounded-2xl border border-border/70 bg-gradient-to-br from-card/60 to-surface/20 p-6 backdrop-blur-md transition-colors hover:border-gold/30"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gold/20 bg-gold/5 text-gold transition-colors group-hover:bg-gold/10">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-lg font-medium text-white group-hover:text-gold">
                {cap.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{cap.description}</p>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-8 overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-r from-gold/10 via-card/40 to-surface/30 p-6 sm:p-8"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs tracking-[0.2em] text-gold uppercase">Assistant preview</p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              &ldquo;Based on your 30-day analytics, your top-converting category is ready for a
              featured collection. I can draft SEO titles and a flash promotion brief.&rdquo;
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-background/50 px-4 py-2 text-xs text-gold">
            <Bot className="h-4 w-4" />
            Nexar AI · Merchant copilot
          </div>
        </div>
      </motion.div>
    </SectionShell>
  );
}
