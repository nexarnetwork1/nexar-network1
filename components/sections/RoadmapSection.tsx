"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Circle } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ROADMAP } from "@/lib/data/roadmap";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { StatusDot } from "@/components/ui/StatusDot";
import { cn } from "@/lib/utils/cn";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

gsap.registerPlugin(ScrollTrigger);

const STATUS_CONFIG = {
  completed: { icon: Check, color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" },
  active: { icon: Circle, color: "text-gold border-gold/30 bg-gold/10" },
  upcoming: { icon: Circle, color: "text-muted border-border bg-card/60" },
};

export function RoadmapSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion || !trackRef.current) return;

    const track = trackRef.current;

    const ctx = gsap.context(() => {
      gsap.to(track, {
        x: () => -(track.scrollWidth - (track.parentElement?.clientWidth ?? window.innerWidth) + 40),
        ease: "none",
        scrollTrigger: {
          trigger: track,
          start: "top 70%",
          end: "bottom 30%",
          scrub: 1,
        },
      });
    });

    return () => ctx.revert();
  }, [reducedMotion]);

  const completedCount = ROADMAP.filter((p) => p.status === "completed").length;
  const activeCount = ROADMAP.filter((p) => p.status === "active").length;
  const progress = ((completedCount + activeCount * 0.5) / ROADMAP.length) * 100;

  return (
    <section id="roadmap" className="section-padding relative overflow-hidden">
      <Container>
        <Reveal className="mb-12">
          <SectionHeading
            eyebrow="Roadmap"
            title="A clear path forward"
            description="Milestone-driven development with transparent progress tracking across every phase of the Nexar ecosystem."
          />
        </Reveal>

        <Reveal className="mb-10">
          <div className="flex items-center gap-4">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${progress}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-gold to-gold-secondary"
              />
            </div>
            <span className="font-mono text-sm text-gold">{Math.round(progress)}%</span>
          </div>
        </Reveal>
      </Container>

      <div className="overflow-x-auto pb-4 scrollbar-none">
        <div ref={trackRef} className="flex gap-6 px-5 sm:px-8 lg:px-12">
          {ROADMAP.map((phase, i) => {
            const config = STATUS_CONFIG[phase.status];
            const StatusIcon = config.icon;

            return (
              <motion.div
                key={phase.quarter}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="w-[320px] shrink-0"
              >
                <div className="luxury-border h-full rounded-2xl bg-card/60 p-6 backdrop-blur-md">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-mono text-xs tracking-wide text-gold">
                      {phase.quarter}
                    </span>
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full border",
                        config.color,
                      )}
                    >
                      <StatusIcon className="h-3 w-3" />
                    </span>
                  </div>
                  <h3 className="font-heading text-xl font-semibold">{phase.title}</h3>
                  <ul className="mt-5 space-y-3">
                    {phase.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-muted">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold/60" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  {phase.status === "active" && (
                    <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1">
                      <StatusDot color="gold" size="xs" />
                      <span className="text-[10px] tracking-wide text-gold uppercase">
                        In Progress
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
