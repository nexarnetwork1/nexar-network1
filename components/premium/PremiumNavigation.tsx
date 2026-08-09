"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Search, LogIn } from "lucide-react";
import { useSession } from "next-auth/react";
import { useAtlasAuth } from "@/components/atlas/auth/AtlasAuthProvider";

export function PremiumNavigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const { openAtlasAuth } = useAtlasAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Platform", href: "/atlas" },
    { label: "Business", href: "/atlas/business" },
    { label: "Marketplace", href: "/atlas/marketplace" },
    { label: "Network", href: "/atlas/network" },
    { label: "Pricing", href: "/atlas/pricing" },
    { label: "Developers", href: "/atlas/docs" },
  ];

  const isAtlasRoute = pathname.startsWith("/atlas");

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || isAtlasRoute
            ? "bg-black/80 backdrop-blur-xl border-b border-white/8"
            : "bg-transparent"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gold flex items-center justify-center">
              <div className="h-5 w-5 rounded-full bg-black" />
            </div>
            <span className="text-xl font-bold tracking-tight">ATLAS</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "text-white bg-white/8"
                    : "text-text-secondary hover:text-white hover:bg-white/4"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:text-white hover:bg-white/4 transition-colors">
              <Search className="h-4 w-4" />
            </button>
            
            {session?.user ? (
              <Link
                href="/dashboard"
                className="btn-primary text-sm px-4 py-2"
              >
                Dashboard
              </Link>
            ) : (
              <button
                onClick={() => openAtlasAuth({ mode: "signin", redirect: "/dashboard" })}
                className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:text-white hover:bg-white/4 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-16 z-50 bg-black">
          <div className="flex flex-col p-6 space-y-4">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="self-end flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:text-white hover:bg-white/4 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    pathname === item.href
                      ? "text-white bg-white/8"
                      : "text-text-secondary hover:text-white hover:bg-white/4"
                  }`}
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
