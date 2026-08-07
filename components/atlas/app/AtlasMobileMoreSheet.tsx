"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useSession } from "next-auth/react";
import { useCommerceAuth } from "@/components/commerce/auth/NexarCommerceAuthProvider";
import { ATLAS_APP_MOBILE_MORE } from "@/config/atlas-app-nav";
import { getAtlasAppNavIcon } from "@/components/atlas/app/atlas-app-nav-icons";

type AtlasMobileMoreSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function AtlasMobileMoreSheet({ open, onClose }: AtlasMobileMoreSheetProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { openCommerceAuth } = useCommerceAuth();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl border border-white/10 bg-[#050505] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Explore ATLAS</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {ATLAS_APP_MOBILE_MORE.map((item) => {
            const Icon = getAtlasAppNavIcon(item.icon);
            const isActive =
              pathname === item.href ||
              (item.href !== "/atlas" && pathname.startsWith(item.href));

            if (item.requiresAuth && !session) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onClose();
                    openCommerceAuth({ mode: "signin", redirect: item.href });
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 text-left text-muted"
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border text-left transition-colors",
                  isActive
                    ? "border-gold/30 bg-gold/10 text-gold"
                    : "border-white/10 bg-white/5 text-white hover:border-gold/20",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
