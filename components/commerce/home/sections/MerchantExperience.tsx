"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, Circle } from "lucide-react";
import { CommerceAuthTrigger } from "@/components/commerce/auth/NexarCommerceAuthProvider";
import { SectionShell } from "@/components/commerce/home/shared/SectionShell";
import { merchantCommerceConfig } from "@/config/merchant-commerce";
import { cn } from "@/lib/utils/cn";

const HIGHLIGHTS = [
  {
    title: "Store Builder",
    description: "Branding, banners, categories, and featured products — live on the unified marketplace.",
    href: "/merchant/store/builder",
  },
  {
    title: "Orders & fulfillment",
    description: "Paid order pipeline with crypto checkout, invoices, and customer notifications.",
    href: "/merchant/orders",
  },
  {
    title: "Revenue & analytics",
    description: "Platform fees, settlement volume, and daily charts from real order data.",
    href: "/merchant/analytics",
  },
];

export function MerchantExperience() {
  return (
    <SectionShell
      id="merchant-platform"
      eyebrow="Merchants"
      title="Merchant experience"
      description="Shopify-grade onboarding and operations — register, configure your store, list products, and accept global crypto payments on Nexar Commerce."
    >
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-border/70 bg-card/40 p-6 sm:p-8">
          <p className="text-xs tracking-[0.2em] text-gold uppercase">Store setup progress</p>
          <ol className="mt-6 space-y-4">
            {merchantCommerceConfig.setupSteps.map((step, index) => (
              <li key={step.id} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-xs text-muted">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{step.label}</p>
                  <Link href={step.href} className="mt-1 inline-flex items-center gap-1 text-xs text-gold hover:underline">
                    Open step
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
                <Circle className="mt-1 h-4 w-4 text-muted" aria-hidden />
              </li>
            ))}
          </ol>
          <CommerceAuthTrigger
            mode="register"
            role="merchant"
            className="mt-8 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-gold/30 bg-gold text-sm font-medium text-background"
          >
            Create merchant account
            <ArrowUpRight className="h-4 w-4" />
          </CommerceAuthTrigger>
        </div>

        <div className="space-y-4">
          {HIGHLIGHTS.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-border/70 bg-gradient-to-br from-surface/60 to-card/30 p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-heading text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 shrink-0 text-gold/70" />
              </div>
              <Link
                href={item.href}
                className={cn(
                  "mt-4 inline-flex items-center gap-1.5 text-sm text-gold transition-colors hover:text-gold-secondary",
                )}
              >
                Open in dashboard
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
