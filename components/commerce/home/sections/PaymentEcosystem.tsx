"use client";

import { motion } from "framer-motion";
import { ArrowRight, Shield } from "lucide-react";
import { CurrencyLogo } from "@/components/payments/CurrencyLogo";
import { SectionShell } from "@/components/commerce/home/shared/SectionShell";
import {
  calculateCommercePlatformFee,
  formatPlatformFeePercent,
} from "@/lib/commerce/payment-fees";
import { getCurrencyMeta } from "@/lib/constants/payment-branding";

const SUPPORTED_ASSETS = [
  { code: "NXR", network: "BNB Smart Chain", status: "live" as const, usage: "Primary ecosystem token" },
  { code: "USDT", network: "BNB Smart Chain", status: "live" as const, usage: "Stablecoin checkout" },
  { code: "USDC", network: "BNB Smart Chain", status: "live" as const, usage: "Stablecoin checkout" },
  { code: "BNB", network: "BNB Smart Chain", status: "live" as const, usage: "Native gas & settlement" },
  { code: "ETH", network: "Multi-chain", status: "live" as const, usage: "Cross-chain payments" },
  { code: "BTC", network: "Bitcoin", status: "live" as const, usage: "Store of value payments" },
];

const FLOW = ["Customer wallet", "Nexar Commerce checkout", "Platform fee deduction", "Merchant settlement"];

export function PaymentEcosystem() {
  const sampleAmount = 1000;

  return (
    <SectionShell
      id="payments"
      eyebrow="Payments"
      title="Global payment ecosystem"
      description="Native Web3 settlement across supported assets with transparent Nexar platform fees applied at checkout, invoice, and merchant analytics."
    >
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {SUPPORTED_ASSETS.map((asset, i) => {
            const meta = getCurrencyMeta(asset.code);
            const feeLabel = formatPlatformFeePercent(asset.code);
            const { platformFee } = calculateCommercePlatformFee(sampleAmount, asset.code);

            return (
              <motion.div
                key={asset.code}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-border/70 bg-card/40 p-5 backdrop-blur-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CurrencyLogo code={asset.code} size={36} />
                    <div>
                      <p className="font-mono text-lg font-semibold text-white">{meta.symbol}</p>
                      <p className="text-xs text-muted">{meta.label}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-400">
                    {asset.status}
                  </span>
                </div>
                <dl className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">Network</dt>
                    <dd className="text-right text-white/90">{asset.network}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">Platform fee</dt>
                    <dd className="font-mono text-gold">{feeLabel}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">Fee on $1,000</dt>
                    <dd className="font-mono text-white/90">${platformFee.toFixed(2)}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-[11px] leading-relaxed text-muted">{asset.usage}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-gold/20 bg-gradient-to-br from-gold/10 via-card/50 to-surface/40 p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-2 text-gold">
              <Shield className="h-4 w-4" />
              <span className="text-xs tracking-[0.2em] uppercase">Nexar fee model</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                <p className="text-xs text-muted">NXR payments</p>
                <p className="mt-1 font-mono text-2xl text-gold">{formatPlatformFeePercent("NXR")}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                <p className="text-xs text-muted">Other crypto</p>
                <p className="mt-1 font-mono text-2xl text-white">{formatPlatformFeePercent("USDT")}</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              Fees are calculated in checkout, invoices, and merchant revenue reports using the same
              platform logic — not display-only copy.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/40 p-6 sm:p-8">
            <p className="mb-5 text-xs tracking-[0.2em] text-gold uppercase">Settlement flow</p>
            <div className="space-y-4">
              {FLOW.map((step, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative flex items-center gap-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 font-mono text-sm text-gold">
                    {i + 1}
                  </div>
                  <div className="flex-1 rounded-xl border border-border/60 bg-surface/50 px-4 py-3 text-sm text-white">
                    {step}
                  </div>
                  {i < FLOW.length - 1 ? (
                    <ArrowRight className="absolute -bottom-3 left-5 h-4 w-4 rotate-90 text-gold/40" />
                  ) : null}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
