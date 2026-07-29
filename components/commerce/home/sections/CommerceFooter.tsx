"use client";

import Link from "next/link";
import {
  FaDiscord,
  FaFacebook,
  FaGithub,
  FaInstagram,
  FaLinkedin,
  FaTelegram,
  FaTiktok,
  FaXTwitter,
} from "react-icons/fa6";
import { SiBinance } from "react-icons/si";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { useLiveMetrics } from "@/hooks/commerce/use-commerce-api";
import { COMMERCE_API_V1, MARKETPLACE_API_V1 } from "@/modules/marketplace/shared/constants";
import { FOOTER_LINKS } from "@/lib/constants/navigation";
import { SITE, SOCIAL } from "@/lib/constants/site";
import type { CommerceCountry, LiveMetricsPayload } from "@/lib/commerce/types";

const SOCIAL_ICONS = [
  { href: SOCIAL.x, icon: FaXTwitter, label: "X" },
  { href: SOCIAL.binanceSquare, icon: SiBinance, label: "Binance Square" },
  { href: SOCIAL.telegram, icon: FaTelegram, label: "Telegram" },
  { href: SOCIAL.tiktok, icon: FaTiktok, label: "TikTok" },
  { href: SOCIAL.instagram, icon: FaInstagram, label: "Instagram" },
  { href: SOCIAL.facebook, icon: FaFacebook, label: "Facebook" },
  { href: SOCIAL.discord, icon: FaDiscord, label: "Discord" },
  { href: SOCIAL.github, icon: FaGithub, label: "GitHub" },
  { href: SOCIAL.linkedin, icon: FaLinkedin, label: "LinkedIn" },
];

type CommerceFooterProps = {
  initialMetrics: LiveMetricsPayload;
  countries: CommerceCountry[];
};

export function CommerceFooter({ initialMetrics, countries }: CommerceFooterProps) {
  const { metrics } = useLiveMetrics(initialMetrics);

  return (
    <footer className="border-t border-border bg-surface/40 backdrop-blur-xl">
      <Container className="py-14 sm:py-16">
        <div className="mb-10 grid gap-4 rounded-2xl border border-border/60 bg-card/30 p-5 sm:grid-cols-4">
          {[
            { label: "Merchants", value: metrics.total_merchants ?? 0 },
            { label: "Products", value: metrics.total_products ?? 0 },
            { label: "Orders", value: metrics.total_orders ?? 0 },
            { label: "Countries", value: countries.length },
          ].map((stat) => (
            <div key={stat.label} className="text-center sm:text-left">
              <p className="text-[10px] tracking-[0.2em] text-muted uppercase">{stat.label}</p>
              <p className="mt-1 font-mono text-xl text-gold">
                <AnimatedCounter value={stat.value} />
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-7 text-muted">
              {SITE.description} Nexar Commerce connects merchants, customers, and crypto
              settlement across a live global network.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {SOCIAL_ICONS.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-all hover:border-gold/30 hover:text-gold"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-medium tracking-[0.2em] text-white uppercase">Commerce</h4>
            <ul className="mt-4 space-y-2.5">
              {[
                { label: "Live statistics", href: `${COMMERCE_API_V1}/statistics/live` },
                { label: "Marketplace feed", href: `${COMMERCE_API_V1}/statistics/marketplace` },
                { label: "Brands", href: `${COMMERCE_API_V1}/brands` },
                { label: "Catalog API", href: `${MARKETPLACE_API_V1}/catalog/products` },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted hover:text-gold">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-medium tracking-[0.2em] text-white uppercase">Platform</h4>
            <ul className="mt-4 space-y-2.5">
              {FOOTER_LINKS.quick.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted hover:text-gold">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-medium tracking-[0.2em] text-white uppercase">Legal</h4>
            <ul className="mt-4 space-y-2.5">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted hover:text-gold">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border/60 pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <p>
            Metrics refresh via{" "}
            <Link href={`${COMMERCE_API_V1}/statistics/live`} className="text-gold hover:underline">
              live API
            </Link>
          </p>
        </div>
      </Container>
    </footer>
  );
}
