/**
 * ATLAS Finance — Zod validators.
 */

import { z } from "zod";

export const financeExpenseCategorySchema = z.enum([
  "travel",
  "salary",
  "operations",
  "marketing",
  "inventory",
  "utilities",
  "custom",
]);

export const financePaymentRailSchema = z.enum([
  "cash",
  "bank",
  "card",
  "wallet",
  "nxr",
  "crypto",
  "apple_pay",
  "google_pay",
  "stripe",
  "paypal",
  "regional",
  "other",
]);

export const ensureFinanceWorkspaceSchema = z.object({
  businessId: z.string().uuid(),
  baseCurrency: z.string().min(3).max(8).optional(),
  actorUserId: z.string().uuid().optional(),
});

export const journalLineSchema = z.object({
  accountId: z.string().uuid(),
  debit: z.number().nonnegative().optional(),
  credit: z.number().nonnegative().optional(),
  memo: z.string().max(500).optional(),
  costCenterId: z.string().uuid().optional(),
  exchangeRate: z.number().positive().optional(),
});

export const postJournalSchema = z.object({
  workspaceId: z.string().uuid(),
  memo: z.string().max(2000).optional(),
  source: z.string().max(80).optional(),
  sourceRefType: z.string().max(80).optional(),
  sourceRefId: z.string().uuid().optional(),
  currency: z.string().min(3).max(8).optional(),
  actorUserId: z.string().uuid().optional(),
  lines: z.array(journalLineSchema).min(2),
});

export const createExpenseSchema = z.object({
  workspaceId: z.string().uuid(),
  amount: z.number().nonnegative(),
  currency: z.string().min(3).max(8).optional(),
  category: financeExpenseCategorySchema,
  customCategory: z.string().max(120).optional(),
  incurredOn: z.string().optional(),
  vendorName: z.string().max(200).optional(),
  paymentRail: financePaymentRailSchema.optional(),
  accountId: z.string().uuid().optional(),
  costCenterId: z.string().uuid().optional(),
  taxAmount: z.number().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
  createdBy: z.string().uuid(),
  postToLedger: z.boolean().optional(),
});

export const createBudgetSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1).max(200),
  amount: z.number().nonnegative(),
  currency: z.string().min(3).max(8).optional(),
  periodKind: z.enum(["monthly", "quarterly", "annual", "custom"]).optional(),
  startsOn: z.string(),
  endsOn: z.string(),
  costCenterId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  alertThreshold: z.number().min(0).max(1).optional(),
});

export const calculateTaxSchema = z.object({
  workspaceId: z.string().uuid(),
  taxRateId: z.string().uuid(),
  taxableAmount: z.number().nonnegative(),
  currency: z.string().min(3).max(8).optional(),
  sourceRefType: z.string().min(1).max(80),
  sourceRefId: z.string().uuid().optional(),
});
