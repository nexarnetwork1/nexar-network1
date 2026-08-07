"use client";

import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { DashboardNavSection } from "@/config/dashboard-nav";
import { AtlasLogo } from "@/components/ui/AtlasLogo";
import { DashboardNavList } from "./DashboardNavList";

type DashboardSidebarProps = {
  sections: DashboardNavSection[];
  brand: string;
  brandHref: string;
  subtitle?: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  className?: string;
};

/**
 * Permanent sidebar from `lg` up. Between `md` and `lg` it renders as a
 * collapsible icon rail; below `md` the shell swaps it for the drawer.
 *
 * It sticks below the fixed site navbar rather than the viewport top, so the
 * offset tracks `--nxr-header-offset` instead of hardcoding a height.
 */
export function DashboardSidebar({
  sections,
  brand,
  brandHref,
  subtitle,
  collapsed,
  onToggleCollapsed,
  className,
}: DashboardSidebarProps) {
  return (
    <aside
      className={cn(
        "sticky top-[var(--nxr-header-offset)] hidden h-[calc(100dvh-var(--nxr-header-offset))] shrink-0 flex-col border-r border-border bg-chrome md:flex",
        collapsed ? "w-[68px]" : "w-64 xl:w-72",
        className,
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center gap-2 border-b border-border",
          collapsed ? "h-auto flex-col px-0 py-2" : "h-16 px-3",
        )}
      >
        {!collapsed ? (
          <Link
            href={brandHref}
            className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 rounded-lg px-2 py-1 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
            aria-label={`${brand}${subtitle ? ` — ${subtitle}` : ""}`}
          >
            <AtlasLogo height={34} className="max-w-full" decorative />
            {subtitle && (
              <span className="truncate pl-0.5 text-[11px] text-muted">{subtitle}</span>
            )}
          </Link>
        ) : (
          <Link
            href={brandHref}
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
            aria-label={brand}
          >
            <AtlasLogo height={26} decorative />
          </Link>
        )}

        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-[18px] w-[18px]" aria-hidden />
          ) : (
            <PanelLeftClose className="h-[18px] w-[18px]" aria-hidden />
          )}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-none">
        <DashboardNavList sections={sections} collapsed={collapsed} />
      </div>
    </aside>
  );
}
