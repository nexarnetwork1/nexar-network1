"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ECOSYSTEM_MODULES } from "@/lib/data/ecosystem";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils/cn";

const STATUS_STYLES = {
  live: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  building: "bg-gold/10 text-gold border-gold/20",
  planned: "bg-white/5 text-muted border-border",
};

export function EcosystemSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState(ECOSYSTEM_MODULES[0].id);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveId((prev) => {
        const idx = ECOSYSTEM_MODULES.findIndex((m) => m.id === prev);
        return ECOSYSTEM_MODULES[(idx + 1) % ECOSYSTEM_MODULES.length].id;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const activeModule = ECOSYSTEM_MODULES.find((m) => m.id === activeId)!;

  return (
    <section id="ecosystem" className="section-padding relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      <Container>
        <Reveal className="mb-16">
          <SectionHeading
            eyebrow="Ecosystem"
            title="Connected modules, unified network"
            description="Seven integrated modules forming a complete payment infrastructure — from wallet to sovereign chain."
            align="center"
          />
        </Reveal>

        <div ref={containerRef} className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-12">
          <div className="relative flex items-center justify-center">
            <div className="relative aspect-square w-full max-w-sm">
              <div className="absolute inset-0 rounded-full border border-gold/10" />
              <div className="absolute inset-[15%] rounded-full border border-white/5" />

              {ECOSYSTEM_MODULES.map((mod, i) => {
                const angle = (i / ECOSYSTEM_MODULES.length) * 2 * Math.PI - Math.PI / 2;
                const radius = 42;
                const x = 50 + radius * Math.cos(angle);
                const y = 50 + radius * Math.sin(angle);
                const isActive = mod.id === activeId;

                return (
                  <motion.button
                    key={mod.id}
                    type="button"
                    onClick={() => setActiveId(mod.id)}
                    className={cn(
                      "absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border transition-all duration-500",
                      isActive
                        ? "border-gold/40 bg-gold/15 shadow-[0_0_30px_-5px_rgba(212,175,55,0.4)]"
                        : "border-border bg-card/60 hover:border-gold/20",
                    )}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    animate={isActive ? { scale: 1.15 } : { scale: 1 }}
                  >
                    <mod.icon className={cn("h-4 w-4", isActive ? "text-gold" : "text-muted")} />
                  </motion.button>
                );
              })}

              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  key={activeId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <activeModule.icon className="mx-auto h-8 w-8 text-gold" />
                  <p className="mt-2 font-heading text-lg font-semibold">{activeModule.title}</p>
                </motion.div>
              </div>

              {ECOSYSTEM_MODULES.map((mod, i) => {
                if (mod.id !== activeId) return null;
                const angle = (i / ECOSYSTEM_MODULES.length) * 2 * Math.PI - Math.PI / 2;
                return (
                  <svg
                    key={`line-${mod.id}`}
                    className="absolute inset-0 h-full w-full"
                    aria-hidden="true"
                  >
                    <line
                      x1="50%"
                      y1="50%"
                      x2={`${50 + 42 * Math.cos(angle)}%`}
                      y2={`${50 + 42 * Math.sin(angle)}%`}
                      stroke="rgba(212,175,55,0.3)"
                      strokeWidth="1"
                    />
                  </svg>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {ECOSYSTEM_MODULES.map((mod, i) => (
              <Reveal key={mod.id} delay={i * 0.04}>
                <motion.button
                  type="button"
                  onClick={() => setActiveId(mod.id)}
                  className={cn(
                    "group w-full rounded-2xl border p-5 text-left transition-all duration-500",
                    mod.id === activeId
                      ? "border-gold/25 bg-card/60"
                      : "border-border bg-card/20 hover:border-gold/15 hover:bg-card/60",
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface/80">
                      <mod.icon className="h-4 w-4 text-gold" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-heading text-base font-semibold">{mod.title}</h3>
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] tracking-wide uppercase",
                            STATUS_STYLES[mod.status],
                          )}
                        >
                          {mod.status}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm leading-6 text-muted">{mod.description}</p>
                    </div>
                  </div>
                </motion.button>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
