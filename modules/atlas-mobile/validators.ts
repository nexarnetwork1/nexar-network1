/**
 * ATLAS Mobile — Zod validators.
 */

import { z } from "zod";

export const mobilePlatformSchema = z.enum([
  "ios",
  "android",
  "tablet_ios",
  "tablet_android",
  "foldable",
  "desktop_companion",
  "wearable",
  "web_pwa",
  "other",
]);

export const mobileSyncScopeSchema = z.enum([
  "business",
  "orders",
  "inventory",
  "crm",
  "connect",
  "wallet",
  "finance",
  "marketplace",
  "network",
  "pulse",
  "ai",
  "settings",
  "all",
]);

export const mobilePushCategorySchema = z.enum([
  "business_alert",
  "marketplace_order",
  "message",
  "mention",
  "payment",
  "invoice",
  "ai_insight",
  "approval",
  "meeting",
  "job",
  "announcement",
  "system",
]);

export const registerDeviceSchema = z.object({
  userId: z.string().uuid(),
  deviceFingerprint: z.string().min(8).max(200),
  platform: mobilePlatformSchema,
  businessId: z.string().uuid().optional(),
  osVersion: z.string().max(40).optional(),
  appVersion: z.string().max(40).optional(),
  model: z.string().max(80).optional(),
  biometricsEnabled: z.boolean().optional(),
  pinEnabled: z.boolean().optional(),
});

export const enqueueOfflineSchema = z.object({
  deviceId: z.string().uuid(),
  userId: z.string().uuid(),
  businessId: z.string().uuid().optional(),
  clientMutationId: z.string().min(1).max(120),
  scope: mobileSyncScopeSchema,
  entityType: z.string().min(1).max(80),
  entityId: z.string().max(80).optional(),
  operation: z.enum(["create", "update", "delete", "upsert"]),
  payload: z.record(z.unknown()),
  baseVersion: z.number().int().optional(),
  conflictStrategy: z
    .enum(["server_wins", "client_wins", "last_write_wins", "manual_merge"])
    .optional(),
});

export const queuePushSchema = z.object({
  userId: z.string().uuid(),
  deviceId: z.string().uuid().optional(),
  businessId: z.string().uuid().optional(),
  category: mobilePushCategorySchema,
  title: z.string().min(1).max(200),
  body: z.string().max(2000).optional(),
  payload: z.record(z.unknown()).optional(),
  deepLink: z.string().max(500).optional(),
});

export const syncPullSchema = z.object({
  deviceId: z.string().uuid(),
  userId: z.string().uuid(),
  businessId: z.string().uuid().optional(),
  scopes: z.array(mobileSyncScopeSchema).min(1).max(20),
});
