"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Store } from "lucide-react";
import { CommerceAuthTrigger } from "@/components/commerce/auth/NexarCommerceAuthProvider";
import { SectionShell } from "@/components/commerce/home/shared/SectionShell";
import { merchantCommerceConfig } from "@/config/merchant-commerce";
import { formatPlatformFeePercent } from "@/lib/commerce/payment-fees";
import type { CommerceSubscriptionPlan } from "@/lib/commerce/types";

type MerchantPricingProps = {
  plans: CommerceSubscriptionPlan[];
};

function formatInterval(days: number) {
  if (days === 30) return "per month";
  if (days === 365) return "per year";
  return `every ${days} days`;
}

const BASE_FEATURES = [
  "Nexar Commerce storefront",
  "Product catalog & inventory",
  "Orders & checkout",
  "Crypto settlement (NXR, USDT, BNB+)",
  "Merchant analytics dashboard",
  "Global Nexar Assistant",
];

export function MerchantPricing({ plans }: MerchantPricingProps) {
  const { storeCreation, subscription } = merchantCommerceConfig;
  const catalogPlans = plans.length
    ? plans
    : [
        {
          id: "default-monthly",
          name: subscription.monthly.label,
          description: subscription.monthly.description,
          price: subscription.monthly.amountUsd,
          currency: subscription.monthly.currency,
          interval_days: subscription.monthly.intervalDays,
          store_id: "",
        },
        {
          id: "default-yearly",
          name: subscription.yearly.label,
          description: subscription.yearly.description,
          price: subscription.yearly.amountUsd,
          currency: subscription.yearly.currency,
          interval_days: subscription.yearly.intervalDays,
          store_id: "",
        },
      ] satisfies CommerceSubscriptionPlan[];

  return (
    <SectionShell
      id="pricing"
      eyebrow="Merchants"
      title="Store creation & subscriptions"
      description="Launch on Nexar Commerce with a one-time store activation fee and flexible subscription billing. Plans sync from the database when merchants publish offerings."
      align="center"
    >
      <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_2fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl border border-gold/25 bg-gradient-to-br from-gold/10 via-card/50 to-surface/40 p-7 text-left"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[11px] tracking-wide text-gold uppercase">
            <Store className="h-3.5 w-3.5" />
            {storeCreation.label}
          </div>
          <p className="font-mono text-4xl text-gold">
            ${storeCreation.amountUsd}
            <span className="ml-2 text-sm text-muted">one-time</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">{storeCreation.description}</p>
          <ul className="mt-5 space-y-2">
            {BASE_FEATURES.slice(0, 4).map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-white/90">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                {feature}
              </li>
            ))}
          </ul>
          <CommerceAuthTrigger
            mode="register"
            role="merchant"
            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full border border-gold/30 bg-gold text-sm font-medium text-background transition-colors hover:bg-gold-secondary"
          >
            Start your store
          </CommerceAuthTrigger>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2">
          {catalogPlans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="flex flex-col rounded-3xl border border-border/70 bg-card/40 p-6 backdrop-blur-md"
            >
              <h3 className="font-heading text-lg font-semibold text-white">{plan.name}</h3>
              {plan.description ? (
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{plan.description}</p>
              ) : (
                <div className="flex-1" />
              )}
              <p className="mt-4 font-mono text-3xl text-gold">
                ${plan.price}
                <span className="ml-1 text-sm text-muted">{plan.currency}</span>
              </p>
              <p className="text-xs text-muted">{formatInterval(plan.interval_days)}</p>
              <p className="mt-3 text-[11px] text-muted">
                NXR checkout fee {formatPlatformFeePercent("NXR")} · other crypto{" "}
                {formatPlatformFeePercent("USDT")}
              </p>
              {plan.store_slug ? (
                <Link
                  href={`/marketplace/shop?store=${encodeURIComponent(plan.store_slug)}`}
                  className="mt-5 text-sm text-gold hover:underline"
                >
                  View merchant store
                </Link>
              ) : (
                <CommerceAuthTrigger
                  mode="register"
                  role="merchant"
                  className="mt-5 text-sm text-gold hover:underline"
                >
                  Get started
                </CommerceAuthTrigger>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
