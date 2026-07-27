export const publicApiConfig = {
  version: "v1",
  basePath: "/api/v1",
  defaultRateLimitPerMinute: 100,
  scopes: [
    "orders:read",
    "orders:write",
    "payments:read",
    "invoices:read",
    "products:read",
    "webhooks:manage",
  ] as const,
  keyPrefix: "nxr_",
} as const;

export type ApiScope = (typeof publicApiConfig.scopes)[number];
