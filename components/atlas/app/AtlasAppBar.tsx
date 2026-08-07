"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, User, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils/cn";
import { ConnectWalletButton } from "@/components/web3/ConnectWalletButton";
import { useCommerceAuth } from "@/components/commerce/auth/NexarCommerceAuthProvider";
import { NetworkSearchBar } from "@/components/atlas/app/network/NetworkSearchBar";
import Image from "next/image";
import { ATLAS_BRAND } from "@/config/atlas-branding";
import { ATLAS_APP_BAR_ITEMS } from "@/config/atlas-app-nav";
import { getAtlasAppNavIcon } from "@/components/atlas/app/atlas-app-nav-icons";
import { openAtlasAssistant } from "@/components/atlas/app/AtlasWorkspaceContext";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function AtlasAppBar() {
  const pathname = usePathname();
  const router = useRouter();
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
    <div className="sticky top-0 z-20 border-b border-border bg-chrome/95 backdrop-blur-xl atlas-app-bar">
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
            <div className="hidden sm:flex flex-col min-w-0">
              <span className="text-sm font-semibold tracking-wide text-foreground leading-tight">
                {ATLAS_BRAND.osLabel}
              </span>
              <span className="text-[10px] text-muted tracking-wide truncate">
                {ATLAS_BRAND.tagline}
              </span>
            </div>
          </Link>

          <div className="hidden md:flex flex-1 max-w-md ml-4">
            <NetworkSearchBar compact />
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => router.push("/atlas/search")}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Search"
          >
            <Search className="h-5 w-5 text-muted" />
          </button>

          {ATLAS_APP_BAR_ITEMS.map((item) => {
            const Icon = getAtlasAppNavIcon(item.icon);
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            if (item.requiresAuth && !session) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleAuthAction(item.href)}
                  className="hidden sm:flex p-2 rounded-lg text-muted hover:text-foreground hover:bg-foreground/5 transition-colors"
                  title={item.label}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "hidden sm:flex p-2 rounded-lg transition-colors relative",
                  isActive ? "text-gold bg-gold/10" : "text-muted hover:text-foreground hover:bg-foreground/5",
                )}
                title={item.appBarTitle ?? item.label}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })}

          <button
            type="button"
            onClick={openAtlasAssistant}
            className="hidden sm:flex p-2 rounded-lg text-muted hover:text-gold hover:bg-gold/10 transition-colors duration-150"
            title="AI Assistant"
            aria-label="Open AI Assistant"
          >
            <Sparkles className="h-5 w-5" />
          </button>

          <ThemeToggle compact className="hidden lg:inline-flex" />

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
              className="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-gold text-on-gold text-sm font-medium hover:bg-gold-accent transition-colors duration-150"
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
