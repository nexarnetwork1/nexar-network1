"use client";

import { motion } from "framer-motion";
import { ArrowRight, Globe2, Shield, Zap } from "lucide-react";
import Link from "next/link";
import { CommerceAuthTrigger } from "@/components/commerce/auth/NexarCommerceAuthProvider";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";
import type { LiveMetricsPayload } from "@/lib/commerce/types";

type CommerceHeroProps = {
  initialMetrics: LiveMetricsPayload;
};

const TRUST = [
  { label: "Trusted Platform", icon: Shield },
  { label: "Global Access", icon: Globe2 },
  { label: "Fast & Efficient", icon: Zap },
] as const;

/**
 * Official marketplace hero — matte stage, uppercase headline, gold CTA,
 * trust strip. Matches the Nexar Marketplace design system artwork.
 */
export function CommerceHero({ initialMetrics }: CommerceHeroProps) {
  void initialMetrics;

  return (
    <section className="relative overflow-hidden pt-10 pb-16 sm:pt-14 sm:pb-20 lg:pb-24">
      {/* Soft boutique lighting over the hero products area */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.07)_0%,transparent_70%)]" />
      </div>

      <Container className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="nxr-trust-bar mb-10">
            {TRUST.map(({ label, icon: Icon }, i) => (
              <div key={label} className="flex items-center gap-6 sm:gap-8">
                {i > 0 && (
                  <span
                    className="hidden h-4 w-px bg-gold/30 sm:block"
                    aria-hidden
                  />
                )}
                <span className="nxr-trust-item">
                  <Icon strokeWidth={1.5} aria-hidden />
                  {label}
                </span>
              </div>
            ))}
          </div>

          <h1 className="font-heading text-[clamp(2.5rem,7vw,4.75rem)] font-bold uppercase leading-[0.98] tracking-[0.02em] text-white">
            Discover. Shop. Enjoy.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
            Quality products from trusted merchants around the world.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link href={MARKETPLACE_ROUTES.shop}>
              <Button size="lg" className="min-w-[10.5rem]">
                Shop Now
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </Link>
            <CommerceAuthTrigger
              mode="register"
              role="merchant"
              className="inline-flex h-12 min-w-[10.5rem] items-center justify-center rounded-[0.625rem] border border-gold/45 px-8 text-sm font-semibold tracking-[0.06em] text-gold uppercase transition-all hover:bg-gold hover:text-background"
            >
              Start Selling
            </CommerceAuthTrigger>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
