"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { TRUSTED_PARTNERS } from "@/lib/data/partners";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils/cn";

export function TrustedPartnersSection() {
  return (
    <section id="partners" className="section-padding relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      <Container>
        <Reveal className="mb-12">
          <SectionHeading
            eyebrow="Partners"
            title="Trusted Partners"
            description="Verified listings and ecosystem partners supporting Nexar Network across multiple chains."
            align="center"
          />
        </Reveal>

        <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
          {TRUSTED_PARTNERS.map((partner, index) => (
            <Reveal key={partner.id} delay={index * 0.08}>
              <Link
                href={partner.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block h-full"
              >
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.25 }}
                  className="luxury-border flex h-[168px] flex-col items-center justify-center gap-4 rounded-2xl bg-card/40 p-8 backdrop-blur-xl transition-colors duration-300 hover:border-gold/30 hover:bg-card/60"
                >
                  <div className="flex h-14 w-full items-center justify-center">
                    <Image
                      src={partner.logoSrc}
                      alt={`${partner.name} logo`}
                      width={180}
                      height={56}
                      className={cn(
                        "max-h-12 w-auto object-contain opacity-90 transition-all duration-300 group-hover:opacity-100 group-hover:brightness-110",
                        partner.logoClassName,
                      )}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-white transition-colors group-hover:text-gold">
                    {partner.name}
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" aria-hidden />
                  </div>
                </motion.div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
