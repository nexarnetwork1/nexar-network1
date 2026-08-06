/**
 * ATLAS AI — Zod validators.
 */

import { z } from "zod";

export const aiCapabilitySchema = z.enum([
  "generate_content",
  "summarize",
  "translate",
  "analyze",
  "predict",
  "forecast",
  "recommend",
  "search",
  "classify",
  "extract",
  "automate",
  "optimize",
]);

export const aiKnowledgeSourceSchema = z.enum([
  "business_document",
  "product",
  "service",
  "policy",
  "invoice",
  "contract",
  "employee",
  "order",
  "analytics",
  "marketplace",
  "network",
  "connect",
  "pulse",
  "manual",
]);

export const aiMemoryScopeSchema = z.enum([
  "user",
  "business",
  "conversation",
  "workspace",
  "long_term",
]);

export const aiInsightKindSchema = z.enum([
  "revenue_forecast",
  "sales_forecast",
  "customer_behavior",
  "inventory_prediction",
  "employee_performance",
  "marketing_performance",
  "business_health",
  "custom",
]);

export const ensureWorkspaceSchema = z.object({
  businessId: z.string().uuid(),
  ownerUserId: z.string().uuid(),
  displayName: z.string().min(1).max(300),
  slug: z.string().min(1).max(120),
});

export const createConversationSchema = z.object({
  workspaceId: z.string().uuid(),
  userId: z.string().uuid(),
  agentId: z.string().uuid().optional(),
  title: z.string().min(1).max(300).optional(),
});

export const runCapabilitySchema = z.object({
  workspaceId: z.string().uuid(),
  capability: aiCapabilitySchema,
  userId: z.string().uuid(),
  prompt: z.string().min(1).max(50000),
  agentSlug: z.string().min(1).max(80).optional(),
  context: z.record(z.unknown()).optional(),
});

export const indexKnowledgeSchema = z.object({
  workspaceId: z.string().uuid(),
  sourceType: aiKnowledgeSourceSchema,
  title: z.string().min(1).max(500),
  content: z.string().min(1).max(200000),
  sourceEntityId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const semanticSearchSchema = z.object({
  workspaceId: z.string().uuid(),
  query: z.string().min(1).max(1000),
  limit: z.number().int().min(1).max(50).optional(),
});

export const executeWorkflowSchema = z.object({
  workspaceId: z.string().uuid(),
  workflowSlug: z.string().min(1).max(120),
  input: z.record(z.unknown()).optional(),
  actorUserId: z.string().uuid().optional(),
});

export const writeMemorySchema = z.object({
  workspaceId: z.string().uuid(),
  scope: aiMemoryScopeSchema,
  key: z.string().min(1).max(200),
  content: z.string().min(1).max(20000),
  userId: z.string().uuid().optional(),
  conversationId: z.string().uuid().optional(),
  importance: z.number().min(0).max(1).optional(),
});
