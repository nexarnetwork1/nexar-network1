"use client";

import Link from "next/link";
import {
FaXTwitter,
FaTelegram,
FaGithub,
FaFacebook,
FaInstagram,
FaLinkedin,
FaDiscord,
FaTiktok,
} from "react-icons/fa6";

import { SiBinance } from "react-icons/si";

import { SITE, SOCIAL, CONTRACTS } from "@/lib/constants/site";
import { FOOTER_LINKS } from "@/lib/constants/navigation";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { ContactForm } from "@/components/contact/ContactForm";

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


export function Footer() {
  return (
    <footer id="contact" className="relative scroll-mt-[var(--nxr-header-offset)] border-t border-border bg-chrome">
      <Container className="py-14 sm:py-18 lg:py-24">
        <div className="grid gap-10 sm:gap-14 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-sm leading-7 text-text-secondary">
              {SITE.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {SOCIAL_ICONS.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-[0.625rem] border border-border text-gold/80 transition-all duration-300 hover:border-gold hover:text-gold"
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
            <ul className="mt-4 sm:mt-5 space-y-2 sm:space-y-3">
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
            <ul className="mt-4 sm:mt-5 space-y-2 sm:space-y-3">
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
            <ul className="mt-4 sm:mt-5 space-y-2 sm:space-y-3">
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

        <div className="mt-8 sm:mt-14 grid gap-10 border-t border-border pt-8 sm:pt-12 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div>
            <h4 className="font-heading text-xl font-semibold text-white">Contact us</h4>
            <p className="mt-3 max-w-md text-sm leading-7 text-muted">
              Questions about NXR, the marketplace, or partnerships? Send a message and our team
              will respond at{" "}
              <a href="mailto:admin@nexarnetwork.org" className="text-gold hover:underline">
                admin@nexarnetwork.org
              </a>
              .
            </p>
          </div>
          <div className="nxr-card luxury-border p-6 sm:p-8">
            <ContactForm />
          </div>
        </div>

        <div className="mt-8 sm:mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:pt-8 sm:flex-row">
          <p className="text-xs text-muted text-center sm:text-left">
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
