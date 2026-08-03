"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { DashboardNavSection } from "@/config/dashboard-nav";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardMobileDrawer } from "./DashboardMobileDrawer";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardContent } from "./DashboardContent";
import { useSidebarCollapsed } from "./useSidebarCollapsed";

type DashboardShellProps = {
  sections: DashboardNavSection[];
  /** Portal name shown in the sidebar and as the first breadcrumb. */
  brand: string;
  brandHref: string;
  subtitle?: string;
  /** Namespaces the persisted collapse preference per portal. */
  storageKey: string;
  actions?: ReactNode;
  /** Rendered above page content, inside the scroll area (banners, notices). */
  banner?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

/**
 * Shared chrome for the customer, merchant and admin portals.
 *
 * Responsive contract:
 *   - `lg` and up  — permanent sidebar
 *   - `md` to `lg` — collapsible icon rail
 *   - below `md`   — off-canvas drawer
 */
export function DashboardShell({
  sections,
  brand,
  brandHref,
  subtitle,
  storageKey,
  actions,
  banner,
  children,
  className,
  contentClassName,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const previousPathname = useRef(pathname);

  const [collapsed, toggleCollapsed] = useSidebarCollapsed(
    `nxr:dashboard-collapsed:${storageKey}`,
  );

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      setDrawerOpen(false);
    }
  }, [pathname]);

  return (
    <div
      className={cn(
        // The portals render inside the site's `nav-offset` wrapper, so full
        // height here means the viewport minus the fixed navbar and ticker.
        // Left transparent so the global star field shows through the chrome.
        "min-h-[calc(100dvh-var(--nxr-header-offset))] w-full text-white",
        className,
      )}
    >
      <div className="flex min-h-[calc(100dvh-var(--nxr-header-offset))]">
        <DashboardSidebar
          sections={sections}
          brand={brand}
          brandHref={brandHref}
          subtitle={subtitle}
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
        />

        <DashboardMobileDrawer
          open={drawerOpen}
          onClose={closeDrawer}
          sections={sections}
          brand={brand}
          subtitle={subtitle}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader
            sections={sections}
            rootLabel={brand}
            rootHref={brandHref}
            onOpenNav={() => setDrawerOpen(true)}
            navOpen={drawerOpen}
            actions={actions}
          />

          <DashboardContent className={contentClassName}>
            {banner}
            {children}
          </DashboardContent>
        </div>
      </div>
    </div>
  );
}
