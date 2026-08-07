"use client";

import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { SectionShell } from "@/components/commerce/home/shared/SectionShell";
import { useLiveMetrics } from "@/hooks/commerce/use-commerce-api";
import type { LiveMetricsPayload } from "@/lib/commerce/types";

type LiveStatisticsProps = {
  initialMetrics: LiveMetricsPayload;
};

type StatDef = {
  key: keyof LiveMetricsPayload;
  label: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  transform?: (v: number) => number;
};

const STATS: StatDef[] = [
  { key: "total_users", label: "Registered Users" },
  { key: "total_merchants", label: "Verified Merchants" },
  { key: "verified_stores", label: "Stores" },
  { key: "total_products", label: "Products" },
  { key: "total_orders", label: "Orders" },
  { key: "countries_active", label: "Countries" },
  { key: "paid_orders", label: "Transactions" },
  {
    key: "sales_volume_usd",
    label: "Marketplace Volume",
    prefix: "$",
    decimals: 0,
  },
  { key: "nxr_payments", label: "NXR Volume" },
  { key: "usdt_payments", label: "USDT Volume" },
];

function StatCard({
  label,
  value,
  prefix,
  suffix,
  decimals,
  enabled,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  enabled: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="luxury-border rounded-2xl bg-card/60 px-5 py-5 backdrop-blur-md transition-shadow hover:shadow-[0_12px_40px_-20px_rgba(212,175,55,0.35)]"
    >
      <p className="text-[10px] tracking-[0.22em] text-muted uppercase">{label}</p>
      <p className="mt-3 font-mono text-2xl font-medium text-white sm:text-3xl">
        <AnimatedCounter
          value={value}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
          enabled={enabled}
        />
      </p>
    </motion.div>
  );
}

export function LiveStatistics({ initialMetrics }: LiveStatisticsProps) {
  const { metrics } = useLiveMetrics(initialMetrics);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });

  return (
    <SectionShell
      id="commerce-stats"
      title="Marketplace Performance"
      description="Live commerce metrics across verified merchants, products, orders, and global payment volume — updated in real time as the network grows."
    >
      <div ref={ref} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {STATS.map((stat, i) => {
          const raw = metrics[stat.key];
          const value =
            typeof raw === "number"
              ? stat.transform
                ? stat.transform(raw)
                : raw
              : 0;

          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.45 }}
            >
              <StatCard
                label={stat.label}
                value={value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                decimals={stat.decimals}
                enabled={inView}
              />
            </motion.div>
          );
        })}
      </div>
    </SectionShell>
  );
}
