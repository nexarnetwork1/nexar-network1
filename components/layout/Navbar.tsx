"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils/cn";
import { useScrolled } from "@/hooks/useScrolled";
import { NavbarWallet } from "@/components/layout/NavbarWallet";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { NavLink } from "@/components/layout/NavLink";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { MobileMenu } from "./MobileMenu";
import { ATLAS_ASSETS } from "@/config/atlas-branding";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrolled = useScrolled(16);

  return (
    <>
      <header
        className={cn(
          "nxr-navbar fixed inset-x-0 top-0 z-30 transition-[background,box-shadow] duration-200 ease-out",
          scrolled && "shadow-[0_1px_0_rgba(255,255,255,0.06)]",
        )}
      >
        <Container className="flex h-full items-center justify-between gap-6">
          <div className="relative z-10 flex shrink-0 items-center gap-2 sm:gap-3">
            <NavLink href="/" aria-label="Nexar Network home">
              <Logo />
            </NavLink>
            <span
              className="hidden h-5 w-px bg-border sm:block"
              aria-hidden="true"
            />
            <Link
              href="/atlas"
              aria-label="ATLAS Business Operating System"
              className="hidden sm:flex items-center gap-2 rounded-[var(--nxr-radius-lg)] border border-border px-2 py-1.5 transition-colors duration-150 hover:border-gold/30 hover:bg-white/[0.03]"
            >
              <div className="relative h-7 w-7 overflow-hidden rounded-md border border-gold/20">
                <Image
                  src={ATLAS_ASSETS.icon512}
                  alt=""
                  fill
                  className="object-contain p-0.5"
                />
              </div>
              <span className="hidden lg:flex flex-col leading-none">
                <span className="text-[10px] font-semibold tracking-[0.12em] text-foreground uppercase">
                  ATLAS
                </span>
                <span className="text-[9px] text-muted">Business OS</span>
              </span>
            </Link>
          </div>

          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-1 lg:flex xl:gap-2"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                className="nxr-nav-link group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:ring-offset-2 focus-visible:ring-offset-chrome"
              >
                <span className="text-small font-medium text-foreground/80 transition-colors duration-150 group-hover:text-foreground">
                  {item.label}
                </span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle compact className="hidden sm:inline-flex" />
            <NavbarWallet />

            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-[var(--nxr-radius-button)] border border-border text-foreground transition-colors duration-150 hover:border-gold/30 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 lg:hidden"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </Container>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
