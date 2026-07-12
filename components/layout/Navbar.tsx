"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Link from "next/link";
import { NAV_ITEMS } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils/cn";
import { useScrolled } from "@/hooks/useScrolled";
import { ConnectWalletButton } from "@/components/web3/ConnectWalletButton";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { MobileMenu } from "./MobileMenu";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrolled = useScrolled(24);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled
            ? "border-b border-border/80 bg-background/70 py-3 backdrop-blur-2xl"
            : "border-b border-transparent bg-transparent py-5",
        )}
      >
        <Container className="flex items-center justify-between gap-6">
          <Link
            href="#home"
            aria-label="Nexar Network home"
            className="relative z-10 shrink-0"
          >
            <Logo />
          </Link>

          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-1 lg:flex xl:gap-1"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative px-2 py-2 lg:px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-full"
              >
                <span className="relative z-10 text-[12px] lg:text-[13px] font-medium tracking-wide text-muted transition-colors duration-300 group-hover:text-white">
                  {item.label}
                </span>
                <span className="absolute inset-0 rounded-full bg-white/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="absolute bottom-1 left-2 lg:left-3 h-px w-0 bg-gradient-to-r from-gold to-gold-secondary transition-all duration-300 group-hover:w-[calc(100%-1rem)] lg:group-hover:w-[calc(100%-1.5rem)]" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ConnectWalletButton
              variant="primary"
              size="sm"
              magnetic
              className="hidden sm:inline-flex"
            />

            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-border text-white transition-colors hover:border-gold/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:hidden"
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
