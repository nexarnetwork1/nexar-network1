export const securityConfig = {
  csrf: {
    cookieName: "nxr_csrf",
    headerName: "x-csrf-token",
    maxAgeSeconds: 3600,
  },
  rateLimit: {
    auth: { limit: 5, windowMs: 60_000 },
    checkout: { limit: 10, windowMs: 60_000 },
    api: { limit: 100, windowMs: 60_000 },
  },
  protectedPrefixes: ["/customer", "/merchant", "/admin", "/dashboard", "/profile", "/wallet", "/orders", "/invoices", "/settings", "/treasury", "/security"],
  roleRoutes: {
    customer: ["/customer", "/dashboard", "/profile", "/wallet", "/orders", "/invoices"],
    merchant: ["/merchant", "/dashboard"],
    business: ["/merchant", "/business", "/dashboard"],
    admin: ["/admin", "/dashboard"],
    super_admin: ["/admin", "/dashboard", "/settings", "/treasury", "/security"],
    platform_owner: [
      "/dashboard",
      "/admin",
      "/merchant",
      "/settings",
      "/treasury",
      "/security",
      "/profile",
    ],
  },
  headers: {
    contentSecurityPolicy: true,
    hsts: true,
    xFrameOptions: "DENY" as const,
    referrerPolicy: "strict-origin-when-cross-origin" as const,
  },
} as const;
