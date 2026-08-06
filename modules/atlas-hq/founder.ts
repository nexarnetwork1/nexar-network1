/**
 * NEXAR HQ — pure helpers (client-safe).
 * Founder detection & role dashboards without DB.
 */

import {
  HQ_ROLE_DASHBOARDS,
  HQ_STAFF_ROLES,
  PLATFORM_OWNER_EMAIL,
  type HqModuleSectionId,
  type HqStaffRole,
} from "./types";

export function normalizeHqEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isPlatformOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return normalizeHqEmail(email) === PLATFORM_OWNER_EMAIL;
}

export function isPlatformOwnerRole(role: string | null | undefined): boolean {
  return role === "platform_owner";
}

/** Customers / merchants must never see HQ affordances. */
export function canSeeNexarHq(input: {
  role?: string | null;
  isPlatformOwner?: boolean;
  isHqStaff?: boolean;
}): boolean {
  if (input.isPlatformOwner || isPlatformOwnerRole(input.role)) return true;
  if (input.isHqStaff) return true;
  return false;
}

export function isProtectedPlatformOwnerAction(
  action: "delete" | "disable" | "suspend" | "demote",
): boolean {
  return (
    action === "delete" ||
    action === "disable" ||
    action === "suspend" ||
    action === "demote"
  );
}

export function assertCanMutatePlatformOwner(
  targetIsPlatformOwner: boolean,
  action: "delete" | "disable" | "suspend" | "demote" | "update",
): void {
  if (
    targetIsPlatformOwner &&
    action !== "update" &&
    isProtectedPlatformOwnerAction(action)
  ) {
    throw new Error("Platform Owner is permanent and cannot be modified this way");
  }
}

export function isHqStaffRole(role: string): role is HqStaffRole {
  return (HQ_STAFF_ROLES as readonly string[]).includes(role);
}

export function dashboardsForStaffRole(
  role: HqStaffRole | "platform_owner",
): readonly HqModuleSectionId[] {
  if (role === "platform_owner") {
    return [
      "dashboard",
      "platform",
      "website",
      "company",
      "team",
      "analytics",
      "finance",
      "marketplace",
      "support",
      "verification",
      "ai",
      "apps",
      "developers",
      "infrastructure",
      "security",
      "settings",
    ];
  }
  return HQ_ROLE_DASHBOARDS[role] ?? ["dashboard"];
}

/** Sidebar modules for normal ATLAS users vs Platform Owner (+ HQ). */
export function atlasSidebarModules(input: {
  showNexarHq: boolean;
}): readonly { id: string; label: string; hqOnly?: boolean }[] {
  const base = [
    { id: "workspace", label: "Workspace" },
    { id: "marketplace", label: "Marketplace" },
    { id: "network", label: "Network" },
    { id: "pulse", label: "Pulse" },
    { id: "finance", label: "Finance" },
    { id: "crm", label: "CRM" },
    { id: "apps", label: "Apps" },
    { id: "settings", label: "Settings" },
  ] as const;

  if (!input.showNexarHq) return base;
  return [...base, { id: "nexar-hq", label: "NEXAR HQ", hqOnly: true }];
}

/**
 * Post-login routing for Platform Owner — ATLAS + NEXAR workspace, not legacy /admin.
 */
export function resolvePostLoginPath(ctx: {
  isPlatformOwner: boolean;
  hqVisibleInSidebar: boolean;
  nexarBusinessId: string | null;
  mustChangePassword: boolean;
  mustEnable2fa: boolean;
}): string {
  if (ctx.mustChangePassword) return "/auth/change-password?hq=1";
  if (ctx.mustEnable2fa) return "/auth/enable-2fa?hq=1";
  if (ctx.isPlatformOwner) {
    const biz = ctx.nexarBusinessId;
    return biz ? `/dashboard?workspace=${biz}&hq=1` : "/dashboard?hq=1";
  }
  if (ctx.hqVisibleInSidebar) return "/dashboard?hq=1";
  return "/dashboard";
}
