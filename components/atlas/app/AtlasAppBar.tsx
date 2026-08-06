"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Users, MessageSquare, Bell, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils/cn";
import { ConnectWalletButton } from "@/components/web3/ConnectWalletButton";
import { useCommerceAuth } from "@/components/commerce/auth/NexarCommerceAuthProvider";
import Image from "next/image";
import { ATLAS_BRAND } from "@/config/atlas-branding";

const appLinks = [
  { href: "/atlas/network", icon: Users, label: "Network", title: "Friends" },
  { href: "/atlas/messages", icon: MessageSquare, label: "Messages" },
  { href: "/atlas/notifications", icon: Bell, label: "Notifications", auth: true },
  { href: "/atlas/profile", icon: User, label: "Profile", auth: true },
];

export function AtlasAppBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { openCommerceAuth } = useCommerceAuth();

  const handleAuthAction = (href: string) => {
    openCommerceAuth({
      mode: "signin",
      redirect: href,
      message: "Sign in to continue on ATLAS",
    });
  };

  return (
    <div className="sticky top-0 z-20 border-b border-white/10 bg-[#050505]/95 backdrop-blur-xl atlas-app-bar">
      <div className="flex h-[var(--atlas-app-bar-height)] items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/atlas" className="flex items-center gap-2 shrink-0">
            <div className="relative h-8 w-8 rounded-lg overflow-hidden border border-gold/20">
              <Image
                src="/brand/atlas/atlas-icon-512.png"
                alt={ATLAS_BRAND.name}
                fill
                className="object-contain p-1"
              />
            </div>
            <span className="hidden sm:block text-sm font-semibold tracking-wide text-white">
              {ATLAS_BRAND.name}
            </span>
          </Link>

          <div className="hidden md:flex flex-1 max-w-md ml-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="search"
                placeholder="Search ATLAS..."
                aria-label="Search ATLAS"
                className="w-full h-9 pl-9 pr-4 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-muted focus:outline-none focus:border-gold/40 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Search"
          >
            <Search className="h-5 w-5 text-muted" />
          </button>

          {appLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            if (item.auth && !session) {
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => handleAuthAction(item.href)}
                  className="hidden sm:flex p-2 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors"
                  title={item.label}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "hidden sm:flex p-2 rounded-lg transition-colors relative",
                  isActive ? "text-gold bg-gold/10" : "text-muted hover:text-white hover:bg-white/5",
                )}
                title={item.title ?? item.label}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })}

          <div className="hidden sm:block">
            <ConnectWalletButton variant="ghost" size="sm" className="h-9 px-2" />
          </div>

          {!session ? (
            <button
              type="button"
              onClick={() =>
                openCommerceAuth({
                  mode: "signin",
                  redirect: pathname,
                  message: "Sign in to ATLAS",
                })
              }
              className="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-gold text-background text-sm font-medium hover:bg-gold-secondary transition-colors"
            >
              Sign In
            </button>
          ) : (
            <Link
              href="/atlas/profile"
              className="hidden sm:flex h-9 w-9 rounded-lg bg-gold/10 border border-gold/30 items-center justify-center overflow-hidden"
            >
              {session.user?.image ? (
                <img src={session.user.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-4 w-4 text-gold" />
              )}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
