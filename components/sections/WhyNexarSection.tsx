"use client";

import { motion } from "framer-motion";
import { FEATURES } from "@/lib/data/features";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils/cn";

const layoutStyles = {
  wide: "md:col-span-2",
  tall: "md:row-span-2",
  standard: "",
};

export function WhyNexarSection() {
  return (
    <section id="technology" className="section-padding relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      <Container>
        <Reveal className="mb-16">
          <SectionHeading
            eyebrow="Why Nexar"
            title="Engineered for enterprise, built for everyone"
            description="Every capability is designed with purpose — security, speed, and scalability at the core of the Nexar ecosystem."
            align="center"
          />
        </Reveal>

        <div className="grid auto-rows-fr gap-4 md:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.id} delay={i * 0.06}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "group relative h-full overflow-hidden rounded-2xl border border-border bg-card/30 p-7 backdrop-blur-sm transition-colors duration-500 hover:border-gold/20 hover:bg-card/50",
                  layoutStyles[feature.layout],
                )}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100",
                    feature.accent,
                  )}
                />
                <div className="relative z-10 flex h-full flex-col">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface/80 transition-colors group-hover:border-gold/30">
                    <feature.icon className="h-5 w-5 text-gold transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold">{feature.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-7 text-muted">
                    {feature.description}
                  </p>
                  <div className="mt-6 h-px w-0 bg-gradient-to-r from-gold to-transparent transition-all duration-500 group-hover:w-full" />
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
