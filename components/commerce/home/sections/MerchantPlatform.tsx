"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  LayoutTemplate,
  Users,
} from "lucide-react";
import { SectionShell } from "@/components/commerce/home/shared/SectionShell";
import { cn } from "@/lib/utils/cn";

const MODULES = [
  {
    id: "builder",
    icon: LayoutTemplate,
    title: "Store Builder",
    points: ["Branding & banners", "Category mapping", "Featured placement"],
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Analytics",
    points: ["Live revenue rollups", "Conversion tracking", "Daily merchant charts"],
  },
  {
    id: "inventory",
    icon: Boxes,
    title: "Inventory",
    points: ["Variants & stock", "Realtime catalog sync", "Product media"],
  },
  {
    id: "orders",
    icon: ClipboardList,
    title: "Orders",
    points: ["Paid order pipeline", "Crypto & card checkout", "Invoice generation"],
  },
  {
    id: "customers",
    icon: Users,
    title: "Customers",
    points: ["Followers & favorites", "Subscriptions", "Activity history"],
  },
];

export function MerchantPlatform() {
  const [active, setActive] = useState(MODULES[0].id);
  const current = MODULES.find((m) => m.id === active) ?? MODULES[0];
  const Icon = current.icon;

  return (
    <SectionShell
      eyebrow="Merchants"
      title="Merchant platform"
      description="Interactive showcase of the tools merchants use to launch, manage, and grow premium storefronts on Nexar Commerce."
    >
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="flex flex-wrap gap-2 lg:flex-col">
          {MODULES.map((mod) => {
            const ModIcon = mod.icon;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => setActive(mod.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                  active === mod.id
                    ? "border-gold/35 bg-gold/10 text-gold"
                    : "border-border/60 bg-card/30 text-muted hover:text-white",
                )}
              >
                <ModIcon className="h-4 w-4" />
                {mod.title}
              </button>
            );
          })}
        </div>

        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-border/70 bg-gradient-to-br from-surface/60 to-card/30 p-8"
        >
          <div className="mb-6 flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10 text-gold">
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <h3 className="font-heading text-xl font-semibold text-white">{current.title}</h3>
              <p className="text-sm text-muted">Enterprise merchant tooling</p>
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {current.points.map((point) => (
              <li
                key={point}
                className="rounded-xl border border-border/60 bg-background/40 px-4 py-4 text-sm text-white/90"
              >
                {point}
              </li>
            ))}
          </ul>
          <div className="mt-8 h-2 overflow-hidden rounded-full bg-border/60">
            <motion.div
              className="h-full bg-gradient-to-r from-gold/80 to-gold-secondary/80"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      </div>
    </SectionShell>
  );
}
