export const features = [
  "auth",
  "catalog",
  "orders",
  "invoices",
  "payments",
  "wallet",
  "merchant",
  "admin",
  "notifications",
] as const;

export type FeatureName = (typeof features)[number];
