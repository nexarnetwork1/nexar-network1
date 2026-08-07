"use client";

import { useState } from "react";
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
          <NavLink href="/" aria-label="Nexar Network home" className="relative z-10 shrink-0">
            <Logo />
          </NavLink>

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
