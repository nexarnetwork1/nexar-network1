"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Search, Bell, User, LogIn, Globe } from "lucide-react";
import { ATLAS_BRAND } from "@/config/atlas-branding";
import { useSession } from "next-auth/react";
import { useCommerceAuth } from "@/components/commerce/auth/NexarCommerceAuthProvider";
import { cn } from "@/lib/utils/cn";

export function PremiumNavigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const { openCommerceAuth } = useCommerceAuth();

  const navItems = [
    { label: "Platform", href: "/atlas" },
    { label: "Business", href: "/atlas/business" },
    { label: "Marketplace", href: "/atlas/marketplace" },
    { label: "Network", href: "/atlas/network" },
    { label: "Modules", href: "/atlas/modules" },
    { label: "Developers", href: "/atlas/developers" },
  ];

  return (
    <>
      <header className="nxr-navbar fixed top-0 left-0 right-0 z-50 h-20">
        <div className="flex h-full items-center justify-between px-6 lg:px-8">
          {/* Logo */}
          <Link href="/atlas" className="flex items-center gap-4">
            <div className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/30 flex items-center justify-center">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-gold to-gold-secondary" />
            </div>
            <div className="hidden sm:block">
              <p className="text-lg font-bold tracking-wider text-white">{ATLAS_BRAND.name}</p>
              <p className="text-xs text-muted/70 tracking-widest uppercase">{ATLAS_BRAND.byline}</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "text-gold bg-gold/10"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button className="hidden sm:flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white/70 hover:text-white hover:border-gold/30 transition-colors">
              <Search className="h-5 w-5" />
            </button>
            
            {session?.user ? (
              <>
                <button className="hidden sm:flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white/70 hover:text-white hover:border-gold/30 transition-colors">
                  <Bell className="h-5 w-5" />
                </button>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gold/10 border border-gold/20 text-gold hover:bg-gold/20 transition-colors font-medium"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Workspace</span>
                </Link>
              </>
            ) : (
              <button
                onClick={() => openCommerceAuth({ mode: "signin", redirect: "/dashboard" })}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold border border-gold/30 text-background hover:bg-gold-secondary transition-colors font-medium"
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
      </header>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="nxr-modal-backdrop lg:hidden fixed inset-0 top-20 z-50 bg-chrome">
          <div className="flex flex-col p-6 space-y-6">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="self-end flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white transition-colors hover:border-gold/30 hover:text-gold"
            >
              <X className="h-5 w-5" />
            </button>
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-lg text-base font-medium transition-colors",
                    pathname === item.href
                      ? "text-gold bg-gold/10"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
