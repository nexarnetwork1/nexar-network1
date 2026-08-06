import { z } from "zod";

export const ingestFeedItemSchema = z.object({
  itemType: z.string(),
  source: z.string(),
  sourceEvent: z.string().optional(),
  title: z.string().min(1).max(500),
  summary: z.string().max(2000).optional(),
  body: z.string().max(20000).optional(),
  businessId: z.string().uuid().optional(),
  payload: z.record(z.unknown()).optional(),
});

export const createArticleSchema = z.object({
  title: z.string().min(2).max(300),
  category: z.enum([
    "technology",
    "ai",
    "marketing",
    "finance",
    "logistics",
    "leadership",
    "sales",
    "startups",
    "business_strategy",
    "general",
  ]),
  bodyHtml: z.string().min(10),
  businessId: z.string().uuid().optional(),
});

export const feedPreferenceSchema = z.object({
  categories: z.array(z.string()).optional(),
  aiRecommendationsEnabled: z.boolean().optional(),
});

export type IngestFeedItemInput = z.infer<typeof ingestFeedItemSchema>;
export type CreateArticleInput = z.infer<typeof createArticleSchema>;
