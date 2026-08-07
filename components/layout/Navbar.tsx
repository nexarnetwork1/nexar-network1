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
          "fixed inset-x-0 top-0 z-30 transition-all duration-400",
          scrolled
            ? "border-b border-border bg-background/92 py-3 backdrop-blur-xl"
            : "border-b border-transparent bg-background/55 py-4 backdrop-blur-md",
        )}
      >
        <Container className="flex items-center justify-between gap-4 sm:gap-6">
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
                className="group relative rounded-md px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span className="text-[13px] font-medium tracking-[0.04em] text-foreground/75 transition-colors duration-300 group-hover:text-foreground">
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
              className="flex h-11 w-11 items-center justify-center rounded-[0.625rem] border border-border text-foreground transition-colors hover:border-gold/40 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 lg:hidden"
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
