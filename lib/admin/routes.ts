/**
 * NEXAR HQ route helpers (replaces wallet Super Admin route gates).
 */

const HQ_PREFIXES = ["/admin", "/settings", "/treasury", "/security"] as const;

export function isHqRoute(pathname: string): boolean {
  return HQ_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Public HQ entry points — no session required. */
export function isHqPublicRoute(pathname: string): boolean {
  return (
    pathname === "/admin/login" ||
    pathname === "/admin/setup" ||
    pathname.startsWith("/admin/setup/") ||
    pathname === "/api/hq/bootstrap" ||
    pathname.startsWith("/api/hq/bootstrap/")
  );
}

/** @deprecated Use isHqRoute */
export const isSuperAdminRoute = isHqRoute;
/** @deprecated Use isHqPublicRoute */
export const isSuperAdminPublicRoute = isHqPublicRoute;
