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

const COMMERCE_LINKS = [
  { label: "Trending products", href: "/marketplace#trending-products" },
  { label: "Featured stores", href: "/marketplace#featured-stores" },
  { label: "Browse categories", href: "/marketplace#categories" },
  { label: "Merchant plans", href: "/marketplace#pricing" },
  { label: "Browse marketplace", href: "/marketplace" },
];

type CommerceFooterProps = {
  initialMetrics: LiveMetricsPayload;
  countries: CommerceCountry[];
};

export function CommerceFooter({ initialMetrics, countries }: CommerceFooterProps) {
  const { metrics } = useLiveMetrics(initialMetrics);

  return (
    <footer className="border-t border-border/70 bg-surface/50 backdrop-blur-xl">
      <Container className="py-14 sm:py-16 lg:py-20">
        <div className="mb-10 grid gap-4 nxr-card p-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Verified merchants", value: metrics.total_merchants ?? 0 },
            { label: "Products listed", value: metrics.total_products ?? 0 },
            { label: "Orders fulfilled", value: metrics.total_orders ?? 0 },
            { label: "Countries served", value: countries.length },
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
              {SITE.description} Discover verified brands, global payments, and a premium
              shopping experience built for modern commerce.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {SOCIAL_ICONS.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-all hover:-translate-y-0.5 hover:border-gold/30 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-medium tracking-[0.2em] text-white uppercase">Marketplace</h4>
            <ul className="mt-4 space-y-2.5">
              {COMMERCE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-gold focus-visible:outline-none focus-visible:text-gold"
                  >
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
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-gold focus-visible:outline-none focus-visible:text-gold"
                  >
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
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-gold focus-visible:outline-none focus-visible:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border/60 pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <p>Premium global commerce · Verified merchants · Secure checkout</p>
        </div>
      </Container>
    </footer>
  );
}
