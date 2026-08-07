"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Bell, MessageSquare, User, Menu, LogOut, Settings } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils/cn";
import { ATLAS_BRAND } from "@/config/atlas-branding";
import { ImprovedWalletConnect } from "@/components/web3/ImprovedWalletConnect";

export function AtlasTopNav() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <header className="nxr-navbar fixed top-0 left-0 right-0 z-50">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Left: Logo */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors">
            ← Back to Nexar
          </Link>
          <div className="h-6 w-px bg-white/10" />
          <Link href="/atlas" className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/30 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-gold to-gold-secondary" />
            </div>
            <div className="hidden sm:block">
              <p className="text-base font-bold tracking-wider text-white">{ATLAS_BRAND.name}</p>
              <p className="text-[10px] text-muted/70 tracking-widest uppercase">{ATLAS_BRAND.byline}</p>
            </div>
          </Link>
        </div>

        {/* Center: Search */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search ATLAS..."
              className="nxr-input w-full h-10 pl-10 pr-4"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile Search */}
          <button className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors">
            <Search className="h-5 w-5" />
          </button>

          {/* Messages */}
          <Link href="/atlas/messages" className="p-2 rounded-lg hover:bg-white/5 transition-colors relative">
            <MessageSquare className="h-5 w-5" />
            {session && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-gold" />
            )}
          </Link>

          {/* Notifications */}
          <button className="p-2 rounded-lg hover:bg-white/5 transition-colors relative">
            <Bell className="h-5 w-5" />
            {session && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-gold" />
            )}
          </button>

          {/* Wallet */}
          <ImprovedWalletConnect />

          {/* Profile / Auth */}
          {session ? (
            <div className="flex items-center gap-2">
              <Link
                href="/atlas/profile"
                className="h-9 w-9 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center"
              >
                <User className="h-4 w-4 text-gold" />
              </Link>
              <button
                onClick={() => signOut()}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4 text-muted" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg bg-gold border border-gold/30 text-background font-medium text-sm hover:bg-gold-secondary transition-colors"
            >
              Sign In
            </Link>
          )}

          {/* Mobile Menu */}
          <button className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
