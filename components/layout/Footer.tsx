"use client";

import Link from "next/link";
import {
  FaXTwitter,
  FaTelegram,
  FaGithub,
  FaFacebook,
  FaInstagram,
} from "react-icons/fa6";
import { SITE, SOCIAL, CONTRACTS } from "@/lib/constants/site";
import { FOOTER_LINKS } from "@/lib/constants/navigation";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";

const SOCIAL_ICONS = [
  { href: SOCIAL.x, icon: FaXTwitter, label: "X" },
  { href: SOCIAL.telegram, icon: FaTelegram, label: "Telegram" },
  { href: SOCIAL.github, icon: FaGithub, label: "GitHub" },
  { href: SOCIAL.facebook, icon: FaFacebook, label: "Facebook" },
  { href: SOCIAL.instagram, icon: FaInstagram, label: "Instagram" },
  { href: SOCIAL.linkedin, icon: FaLinkedin, label: "LinkedIn" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-surface/40 backdrop-blur-xl">
      <Container className="py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-sm leading-7 text-muted">
              {SITE.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {SOCIAL_ICONS.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted transition-all hover:border-gold/30 hover:text-gold"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-medium tracking-[0.2em] text-white uppercase">
              Quick Links
            </h4>
            <ul className="mt-5 space-y-3">
              {FOOTER_LINKS.quick.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-medium tracking-[0.2em] text-white uppercase">
              Resources
            </h4>
            <ul className="mt-5 space-y-3">
              {FOOTER_LINKS.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-medium tracking-[0.2em] text-white uppercase">
              Legal
            </h4>
            <ul className="mt-5 space-y-3">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <p className="font-mono text-[10px] text-muted/50">
            {SITE.ticker} · {CONTRACTS.token.slice(0, 10)}…{CONTRACTS.token.slice(-6)}
          </p>
        </div>
      </Container>
    </footer>
  );
}
