"use client";

import { Menu } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import type { DashboardNavSection } from "@/config/dashboard-nav";
import { AtlasLogo } from "@/components/ui/AtlasLogo";
import { DashboardBreadcrumb } from "./DashboardBreadcrumb";

type DashboardHeaderProps = {
  sections: DashboardNavSection[];
  rootLabel: string;
  rootHref: string;
  onOpenNav: () => void;
  navOpen: boolean;
  /** Portal-supplied controls: search, notifications, profile menu, sign out. */
  actions?: ReactNode;
  className?: string;
};

export function DashboardHeader({
  sections,
  rootLabel,
  rootHref,
  onOpenNav,
  navOpen,
  actions,
  className,
}: DashboardHeaderProps) {
  return (
    <header
      className={cn(
        // z-20 keeps this under the site navbar (z-30), which stays fixed above it.
        "sticky top-[var(--nxr-header-offset)] z-20 flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[#050505]/95 px-4 backdrop-blur-xl sm:px-6",
        className,
      )}
    >
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open navigation menu"
        aria-expanded={navOpen}
        aria-controls="dashboard-mobile-nav"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-white transition-colors hover:border-gold/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background md:hidden"
      >
        <Menu className="h-[18px] w-[18px]" aria-hidden />
      </button>

      <div className="hidden shrink-0 sm:block md:hidden" aria-hidden>
        <AtlasLogo height={28} decorative />
      </div>

      <DashboardBreadcrumb
        sections={sections}
        rootLabel={rootLabel}
        rootHref={rootHref}
        className="min-w-0 flex-1"
      />

      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
