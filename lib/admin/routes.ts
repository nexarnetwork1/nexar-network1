const SUPER_ADMIN_PREFIXES = ["/admin", "/settings", "/treasury", "/security"] as const;

export function isSuperAdminRoute(pathname: string): boolean {
  return SUPER_ADMIN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isSuperAdminPublicRoute(pathname: string): boolean {
  return pathname === "/admin/login" || pathname.startsWith("/api/admin/wallet/");
}
