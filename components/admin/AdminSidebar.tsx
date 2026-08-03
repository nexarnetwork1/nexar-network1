"use client";

import { ADMIN_NAV } from "@/config/dashboard-nav";
import { DashboardNavList } from "@/components/dashboard/DashboardNavList";

/**
 * Standalone admin navigation panel.
 *
 * The dashboard layout renders its sidebar through `DashboardShell`; this
 * wrapper stays because it is re-exported from `features/admin`. Its link list
 * now comes from the shared `ADMIN_NAV` config so there is a single source of
 * truth for admin routes.
 */
export function AdminSidebar() {
  return (
    <aside className="w-72 shrink-0 border-r border-border bg-surface/60">
      <div className="border-b border-border p-6">
        <h1 className="font-heading text-2xl font-bold text-gold">Nexar Admin</h1>
        <p className="mt-1 text-sm text-muted">Platform control</p>
      </div>

      <DashboardNavList sections={ADMIN_NAV} />
    </aside>
  );
}
