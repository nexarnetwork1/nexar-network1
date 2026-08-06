/**
 * ATLAS Marketplace — AI commerce contracts (pure).
 * Atlas AI plugs into these; no LLM calls here.
 */

import type { MarketplaceAiAction } from "./types";

export const MARKETPLACE_AI_ACTIONS: readonly MarketplaceAiAction[] = [
  "generate_description",
  "generate_seo",
  "suggest_price",
  "predict_sales",
  "recommend_products",
  "detect_fraud",
  "optimize_inventory",
] as const;

export type MarketplaceAiRequest = {
  action: MarketplaceAiAction;
  businessId: string;
  listingId?: string;
  productId?: string;
  context?: Record<string, unknown>;
};

export type MarketplaceAiResult = {
  action: MarketplaceAiAction;
  status: "stub" | "ok";
  output: Record<string, unknown>;
};

export function createMarketplaceAiStub(
  request: MarketplaceAiRequest,
): MarketplaceAiResult {
  const stubs: Record<MarketplaceAiAction, Record<string, unknown>> = {
    generate_description: {
      description: "AI-generated product description (stub).",
    },
    generate_seo: {
      title: "SEO title stub",
      metaDescription: "SEO meta stub",
    },
    suggest_price: { suggestedPrice: null, reason: "Needs sales history" },
    predict_sales: { units: 0, horizon: "30d", confidence: 0 },
    recommend_products: { listingIds: [] },
    detect_fraud: { riskScore: 0, flags: [] },
    optimize_inventory: { reorderPoint: null, note: "stub" },
  };

  return {
    action: request.action,
    status: "stub",
    output: {
      ...stubs[request.action],
      businessId: request.businessId,
      listingId: request.listingId ?? null,
    },
  };
}
