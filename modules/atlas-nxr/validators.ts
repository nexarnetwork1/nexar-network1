/**
 * ATLAS NXR — Zod validators.
 */

import { z } from "zod";

export const nxrAccountKindSchema = z.enum([
  "personal",
  "business",
  "treasury",
  "reward_pool",
  "reserve",
  "developer",
]);

export const nxrUtilitySchema = z.enum([
  "subscription",
  "marketplace",
  "app_purchase",
  "premium_feature",
  "ai_credits",
  "advertising",
  "verification",
  "boost",
  "developer_revenue",
]);

export const ensureNxrAccountSchema = z.object({
  kind: z.enum(["personal", "business"]),
  userId: z.string().uuid().optional(),
  businessId: z.string().uuid().optional(),
  fiatWalletId: z.string().uuid().optional(),
});

export const transferNxrSchema = z.object({
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),
  amount: z.number().positive(),
  memo: z.string().max(500).optional(),
  actorUserId: z.string().uuid().optional(),
  businessId: z.string().uuid().optional(),
  utility: nxrUtilitySchema.optional(),
  referenceType: z.string().max(80).optional(),
  referenceId: z.string().uuid().optional(),
});

export const payWithNxrSchema = z.object({
  payerAccountId: z.string().uuid(),
  payeeAccountId: z.string().uuid().optional(),
  amount: z.number().positive(),
  utility: nxrUtilitySchema,
  actorUserId: z.string().uuid().optional(),
  businessId: z.string().uuid().optional(),
  referenceType: z.string().max(80).optional(),
  referenceId: z.string().uuid().optional(),
  memo: z.string().max(500).optional(),
});

export const grantRewardSchema = z.object({
  toAccountId: z.string().uuid(),
  ruleCode: z.string().min(1).max(80),
  baseAmount: z.number().nonnegative().optional(),
  campaignId: z.string().uuid().optional(),
  actorUserId: z.string().uuid().optional(),
  businessId: z.string().uuid().optional(),
  referenceType: z.string().max(80).optional(),
  referenceId: z.string().uuid().optional(),
});
