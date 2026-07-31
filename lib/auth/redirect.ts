import type { UserRole } from "@/types";

const DASHBOARD_PATHS: Record<UserRole, string> = {
  customer: "/marketplace",
  merchant: "/merchant",
  admin: "/admin/dashboard",
};

export function getDashboardPath(role: UserRole | string | undefined): string {
  if (role && role in DASHBOARD_PATHS) {
    return DASHBOARD_PATHS[role as UserRole];
  }
  return "/";
}

export function isValidRedirect(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("://");
}
