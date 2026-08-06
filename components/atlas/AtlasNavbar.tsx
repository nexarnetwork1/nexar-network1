"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, LogIn, User } from "lucide-react";
import { ATLAS_BRAND, ATLAS_ASSETS } from "@/config/atlas-branding";
import { useSession } from "next-auth/react";
import { useCommerceAuth } from "@/components/commerce/auth/NexarCommerceAuthProvider";
import { cn } from "@/lib/utils/cn";

export function AtlasNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const { openCommerceAuth } = useCommerceAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/10 bg-[#0a0a0b]/95 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <Link href="/atlas" className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-gold to-gold-secondary" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold tracking-wider text-gold">{ATLAS_BRAND.name}</p>
            <p className="text-[10px] text-muted/70">{ATLAS_BRAND.byline}</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          <NavLink href="/atlas">Overview</NavLink>
          <NavLink href="/atlas/modules">Modules</NavLink>
          <NavLink href="/atlas/pricing">Pricing</NavLink>
          <NavLink href="/atlas/docs">Documentation</NavLink>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {session?.user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold/10 border border-gold/20 text-gold hover:bg-gold/20 transition-colors text-sm font-medium"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Workspace</span>
            </Link>
          ) : (
            <button
              onClick={() => openCommerceAuth({ mode: "signin", redirect: "/dashboard" })}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold border border-gold/30 text-background hover:bg-gold-secondary transition-colors text-sm font-medium"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white transition-colors hover:border-gold/30 hover:text-gold"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-16 z-50 bg-[#0a0a0b]">
          <div className="flex flex-col p-4 space-y-4">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="self-end flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white transition-colors hover:border-gold/30 hover:text-gold"
            >
              <X className="h-5 w-5" />
            </button>
            <nav className="flex flex-col space-y-2">
              <MobileNavLink href="/atlas" onClick={() => setMobileOpen(false)}>
                Overview
              </MobileNavLink>
              <MobileNavLink href="/atlas/modules" onClick={() => setMobileOpen(false)}>
                Modules
              </MobileNavLink>
              <MobileNavLink href="/atlas/pricing" onClick={() => setMobileOpen(false)}>
                Pricing
              </MobileNavLink>
              <MobileNavLink href="/atlas/docs" onClick={() => setMobileOpen(false)}>
                Documentation
              </MobileNavLink>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-4 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors font-medium"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="px-4 py-3 rounded-lg text-base text-white/70 hover:text-white hover:bg-white/5 transition-colors font-medium"
    >
      {children}
    </Link>
  );
}
