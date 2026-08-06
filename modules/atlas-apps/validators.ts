/**
 * ATLAS Apps — Zod validators.
 */

import { z } from "zod";

export const appCategorySlugSchema = z.enum([
  "crm",
  "hr",
  "finance",
  "accounting",
  "inventory",
  "pos",
  "restaurant",
  "clinic",
  "hospital",
  "hotel",
  "manufacturing",
  "booking",
  "education",
  "construction",
  "real_estate",
  "shipping",
  "logistics",
  "marketing",
  "support",
  "analytics",
  "ai",
  "developer_tools",
  "other",
]);

export const appPermissionScopeSchema = z.enum([
  "business",
  "products",
  "orders",
  "crm",
  "finance",
  "employees",
  "wallet",
  "documents",
  "ai",
  "marketplace",
  "connect",
  "pulse",
  "network",
  "analytics",
  "settings",
]);

export const installAppSchema = z.object({
  applicationId: z.string().uuid(),
  businessId: z.string().uuid(),
  installedBy: z.string().uuid(),
  version: z.string().max(40).optional(),
  grantedScopes: z
    .array(
      z.object({
        scope: appPermissionScopeSchema,
        accessLevel: z.enum(["read", "write", "admin"]),
      }),
    )
    .optional(),
});

export const discoverAppsSchema = z.object({
  query: z.string().max(200).optional(),
  categorySlug: appCategorySlugSchema.optional(),
  featuredOnly: z.boolean().optional(),
  verifiedOnly: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const submitReviewSchema = z.object({
  applicationId: z.string().uuid(),
  userId: z.string().uuid(),
  businessId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  body: z.string().max(5000).optional(),
});

export const publishVersionSchema = z.object({
  applicationId: z.string().uuid(),
  version: z.string().min(1).max(40),
  changelog: z.string().max(10000).optional(),
  manifest: z.record(z.unknown()),
  developerId: z.string().uuid(),
});
