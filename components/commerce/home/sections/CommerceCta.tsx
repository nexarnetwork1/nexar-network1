"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { CommerceAuthTrigger } from "@/components/commerce/auth/NexarCommerceAuthProvider";
import { Container } from "@/components/ui/Container";

export function CommerceCta() {
  return (
    <section className="relative overflow-hidden py-[var(--nxr-section-gap)]">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[2rem] border border-gold/25 bg-gradient-to-br from-gold/10 via-card/50 to-surface/40 px-8 py-14 text-center sm:px-12 sm:py-16"
        >
          <div className="pointer-events-none absolute inset-0">
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute -left-20 top-0 h-56 w-56 rounded-full bg-gold/20 blur-3xl"
            />
            <motion.div
              animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 1 }}
              className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-gold/15 blur-3xl"
            />
          </div>

          <div className="relative">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-background/40 px-4 py-1.5 text-[11px] tracking-[0.2em] text-gold uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              Launch on Nexar
            </div>
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Ready to build on the Nexar Commerce network?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              Join verified merchants, accept crypto payments, and scale with enterprise analytics —
              all on infrastructure designed for global settlement.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <CommerceAuthTrigger
                mode="register"
                role="merchant"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-gold/30 bg-gold px-7 text-sm font-medium tracking-wide text-background shadow-[0_0_30px_-8px_rgba(212,175,55,0.55)] transition-all hover:bg-gold-secondary"
              >
                Create merchant account
                <ArrowUpRight className="h-4 w-4" />
              </CommerceAuthTrigger>
              <CommerceAuthTrigger
                mode="register"
                role="customer"
                className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-surface/70 px-7 text-sm font-medium text-white backdrop-blur-md transition-all hover:border-gold/30"
              >
                Start shopping
              </CommerceAuthTrigger>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
