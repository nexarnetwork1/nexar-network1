"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useSession } from "next-auth/react";
import { useCommerceAuth } from "@/components/commerce/auth/NexarCommerceAuthProvider";
import {
  ATLAS_APP_NAV_ITEMS,
  ATLAS_APP_BUSINESS_ITEMS,
} from "@/config/atlas-app-nav";
import { getAtlasAppNavIcon } from "@/components/atlas/app/atlas-app-nav-icons";

export function AtlasLeftSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { openCommerceAuth } = useCommerceAuth();

  return (
    <nav className="p-4 space-y-6">
      {session ? (
        <Link
          href="/atlas/create-post"
          className="flex items-center gap-3 px-4 py-3 rounded-[var(--nxr-radius-lg)] bg-gold border border-gold/30 text-on-gold font-medium hover:bg-gold-hover transition-colors duration-150"
        >
          <Plus className="h-5 w-5" />
          <span>Create Post</span>
        </Link>
      ) : (
        <button
          type="button"
          onClick={() =>
            openCommerceAuth({
              mode: "signin",
              redirect: "/atlas/create-post",
              message: "Sign in to create a post",
            })
          }
          className="flex w-full items-center gap-3 px-4 py-3 rounded-[var(--nxr-radius-lg)] bg-gold border border-gold/30 text-on-gold font-medium hover:bg-gold-hover transition-colors duration-150"
        >
          <Plus className="h-5 w-5" />
          <span>Create Post</span>
        </button>
      )}

      <div className="space-y-1">
        {ATLAS_APP_NAV_ITEMS.map((item) => {
          const Icon = getAtlasAppNavIcon(item.icon);
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          if (item.requiresAuth && !session) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  openCommerceAuth({
                    mode: "signin",
                    redirect: item.href,
                  })
                }
                className="nxr-nav-link w-full"
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn("nxr-nav-link w-full", isActive && "nxr-nav-link-active font-medium")}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {session && (
        <div className="space-y-3">
          <div className="px-4 py-2">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Business</p>
          </div>
          <div className="space-y-1">
            {ATLAS_APP_BUSINESS_ITEMS.map((item) => {
              const Icon = getAtlasAppNavIcon(item.icon);
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn("nxr-nav-link w-full", isActive && "nxr-nav-link-active font-medium")}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
