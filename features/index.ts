/**
 * Feature modules — UI-facing composition layer.
 * Each feature bundles hooks, components, and re-exports from services/modules.
 * No business logic here; delegate to services and modules.
 */

export const features = [
  "auth",
  "catalog",
  "cart",
  "orders",
  "invoices",
  "payments",
  "wallet",
  "merchant",
  "admin",
  "notifications",
] as const;

export type FeatureName = (typeof features)[number];
