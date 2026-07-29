"use client";

import { motion } from "framer-motion";
import { ArrowRight, Link2 } from "lucide-react";
import { SectionShell } from "@/components/commerce/home/shared/SectionShell";

const ASSETS = [
  { symbol: "NXR", name: "Nexar Token", status: "live", color: "from-gold/20 to-gold/5" },
  { symbol: "USDT", name: "Tether USD", status: "live", color: "from-emerald-500/15 to-emerald-500/5" },
  { symbol: "BNB", name: "BNB Chain", status: "live", color: "from-amber-500/15 to-amber-500/5" },
  { symbol: "EVM+", name: "Future chains", status: "roadmap", color: "from-white/10 to-white/5" },
];

const FLOW = ["Customer wallet", "Nexar checkout", "Treasury settlement", "Merchant payout"];

export function CryptoPayments() {
  return (
    <SectionShell
      eyebrow="Payments"
      title="Crypto-native checkout"
      description="Animated settlement paths across supported assets — every payment session is recorded and reflected in live commerce metrics."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {ASSETS.map((asset, i) => (
            <motion.div
              key={asset.symbol}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className={`rounded-2xl border border-border/70 bg-gradient-to-br ${asset.color} p-5 backdrop-blur-md`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xl font-semibold text-white">{asset.symbol}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                    asset.status === "live"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-white/10 text-muted"
                  }`}
                >
                  {asset.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">{asset.name}</p>
            </motion.div>
          ))}
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/40 p-6 sm:p-8">
          <p className="mb-6 text-xs tracking-[0.2em] text-gold uppercase">Payment flow</p>
          <div className="space-y-4">
            {FLOW.map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="relative flex items-center gap-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 font-mono text-sm text-gold">
                  {i + 1}
                </div>
                <div className="flex-1 rounded-xl border border-border/60 bg-surface/50 px-4 py-3 text-sm text-white">
                  {step}
                </div>
                {i < FLOW.length - 1 ? (
                  <motion.div
                    animate={{ x: [0, 6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.2 }}
                    className="absolute -bottom-3 left-5 text-gold/50"
                  >
                    <ArrowRight className="h-4 w-4 rotate-90" />
                  </motion.div>
                ) : null}
              </motion.div>
            ))}
          </div>
          <div className="mt-8 flex items-center gap-2 text-xs text-muted">
            <Link2 className="h-4 w-4 text-gold" />
            Settlement volumes feed directly into live NXR and USDT counters.
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
