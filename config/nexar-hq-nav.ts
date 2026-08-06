/**
 * NEXAR HQ navigation architecture.
 * Legacy ADMIN_NAV (`config/dashboard-nav.ts`) maps into these sections.
 * UI deferred — this is the sole admin IA for ATLAS.
 */

import type { HqModuleSectionId } from "@/modules/atlas-hq/types";
import { HQ_MODULE_SECTIONS } from "@/modules/atlas-hq/types";

/** Maps legacy `/admin/*` routes into NEXAR HQ module sections. */
export const LEGACY_ADMIN_TO_HQ: Record<string, HqModuleSectionId> = {
  "/admin/dashboard": "dashboard",
  "/admin/analytics": "analytics",
  "/admin/revenue": "finance",
  "/admin/merchants": "platform",
  "/admin/customers": "platform",
  "/admin/users": "platform",
  "/admin/orders": "platform",
  "/admin/invoices": "finance",
  "/admin/payments": "finance",
  "/admin/products": "marketplace",
  "/admin/marketplace": "marketplace",
  "/admin/reviews": "marketplace",
  "/admin/treasury": "finance",
  "/admin/platform-fees": "finance",
  "/admin/exchange-rates": "finance",
  "/admin/currencies": "finance",
  "/admin/coupons": "marketplace",
  "/admin/promotions": "marketplace",
  "/admin/verification": "verification",
  "/admin/withdrawals": "finance",
  "/admin/settlement-reports": "finance",
  "/admin/escrow": "finance",
  "/admin/disputes": "support",
  "/admin/contact": "support",
  "/admin/audit-logs": "security",
  "/admin/security": "security",
  "/admin/system-health": "infrastructure",
  "/admin/news-ticker": "website",
  "/admin/settings": "settings",
  "/admin/reports": "analytics",
};

export const NEXAR_HQ_NAV = HQ_MODULE_SECTIONS.map((section) => ({
  id: section.id,
  label: section.label,
  capabilities: section.capabilities,
  /** Temporary: keep serving existing admin pages until HQ UI ships. */
  legacyHref:
    Object.entries(LEGACY_ADMIN_TO_HQ).find(([, s]) => s === section.id)?.[0] ??
    "/admin/dashboard",
}));

export function hqSectionForLegacyPath(path: string): HqModuleSectionId | null {
  const exact = LEGACY_ADMIN_TO_HQ[path];
  if (exact) return exact;
  const prefix = Object.keys(LEGACY_ADMIN_TO_HQ).find((p) =>
    path.startsWith(p),
  );
  return prefix ? LEGACY_ADMIN_TO_HQ[prefix] : null;
}
