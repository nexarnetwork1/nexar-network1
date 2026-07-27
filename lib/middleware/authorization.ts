import { securityConfig } from "@/config";
import type { UserRole } from "@/types";

export function isProtectedRoute(pathname: string): boolean {
  return securityConfig.protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function hasRoleAccess(pathname: string, role: string): boolean {
  const allowedPrefixes =
    securityConfig.roleRoutes[role as UserRole] ?? [];

  return allowedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function getAllowedPrefixes(role: string): readonly string[] {
  return securityConfig.roleRoutes[role as UserRole] ?? [];
}
