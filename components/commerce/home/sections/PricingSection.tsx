"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SectionShell } from "@/components/commerce/home/shared/SectionShell";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";
import type { CommerceSubscriptionPlan } from "@/lib/commerce/types";

type PricingSectionProps = {
  plans: CommerceSubscriptionPlan[];
};

function formatInterval(days: number) {
  if (days === 30) return "/ month";
  if (days === 365) return "/ year";
  return `/ ${days} days`;
}

export function PricingSection({ plans }: PricingSectionProps) {
  return (
    <SectionShell
      id="pricing"
      eyebrow="Plans"
      title="Subscription pricing"
      description="Active merchant subscription plans loaded dynamically from the database — never hardcoded."
      align="center"
    >
      {plans.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -6 }}
              className="flex flex-col rounded-3xl border border-border/70 bg-gradient-to-b from-card/70 to-surface/30 p-7 backdrop-blur-md transition-colors hover:border-gold/30"
            >
              {plan.store_name ? (
                <p className="text-[11px] tracking-wide text-muted uppercase">{plan.store_name}</p>
              ) : null}
              <h3 className="mt-2 font-heading text-xl font-semibold text-white">{plan.name}</h3>
              {plan.description ? (
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{plan.description}</p>
              ) : (
                <div className="flex-1" />
              )}
              <div className="mt-6 border-t border-border/60 pt-6">
                <p className="font-mono text-3xl text-gold">
                  {plan.price.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                  <span className="ml-1 text-sm text-muted">{plan.currency}</span>
                </p>
                <p className="mt-1 text-xs text-muted">{formatInterval(plan.interval_days)}</p>
              </div>
              {plan.store_slug ? (
                <Link
                  href={MARKETPLACE_ROUTES.store(plan.store_slug)}
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-sm font-medium text-gold transition-colors hover:bg-gold/15"
                >
                  View plan
                </Link>
              ) : null}
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-muted">
          Subscription plans will appear as merchants publish active offerings.
        </p>
      )}
    </SectionShell>
  );
}
