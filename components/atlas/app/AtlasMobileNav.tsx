"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { useSession } from "next-auth/react";
import { useCommerceAuth } from "@/components/commerce/auth/NexarCommerceAuthProvider";
import { ATLAS_APP_MOBILE_PRIMARY } from "@/config/atlas-app-nav";
import { getAtlasAppNavIcon } from "@/components/atlas/app/atlas-app-nav-icons";
import { AtlasMobileMoreSheet } from "@/components/atlas/app/AtlasMobileMoreSheet";

export function AtlasMobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { openCommerceAuth } = useCommerceAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const openAuth = (href: string) => {
    openCommerceAuth({
      mode: "signin",
      redirect: href,
      message: "Sign in to continue",
    });
  };

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/98 backdrop-blur-xl border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="ATLAS mobile navigation"
      >
        <div className="flex items-end justify-around h-16 px-1">
          {ATLAS_APP_MOBILE_PRIMARY.map((item) => {
            const Icon = getAtlasAppNavIcon(item.icon);
            const isMore = item.id === "more";
            const isActive =
              !isMore &&
              (pathname === item.href ||
                (item.href !== "/atlas" && pathname.startsWith(item.href)));

            if (isMore) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMoreOpen(true)}
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 min-w-0 py-1 transition-colors",
                    moreOpen ? "text-gold" : "text-muted hover:text-white",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] mt-0.5 truncate w-full text-center font-medium">
                    {item.label}
                  </span>
                </button>
              );
            }

            if (item.requiresAuth && !session) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openAuth(item.href)}
                  className="flex flex-col items-center justify-center flex-1 min-w-0 py-1 text-muted"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] mt-0.5 truncate w-full text-center">{item.label}</span>
                </button>
              );
            }

            if (item.mobilePrimary) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex flex-col items-center justify-center flex-1 min-w-0 -mt-3"
                >
                  <div className="h-11 w-11 rounded-full bg-gold border-[3px] border-background flex items-center justify-center">
                    <Icon className="h-5 w-5 text-background" />
                  </div>
                  <span className="text-[10px] mt-1 text-gold font-medium">{item.label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 min-w-0 py-1 transition-colors",
                  isActive ? "text-gold" : "text-muted hover:text-white",
                )}
              >
                <Icon className="h-5 w-5" />
                <span
                  className={cn(
                    "text-[10px] mt-0.5 truncate w-full text-center",
                    isActive && "font-medium",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      <AtlasMobileMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
