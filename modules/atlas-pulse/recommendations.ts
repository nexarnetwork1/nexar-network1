/**
 * ATLAS Pulse recommendation engine — rules-based foundation.
 * Consumes signals; outputs scored recommendations. AI layer plugs in later.
 */

export type RecommendationSignal = {
  industry?: string | null;
  businessSize?: "small" | "medium" | "large" | null;
  location?: string | null;
  connectionBusinessIds?: string[];
  followedBusinessIds?: string[];
  recentPurchaseCategories?: string[];
  marketplaceActivityScore?: number;
};

export type RecommendationCandidate = {
  entityType: "business" | "product" | "article" | "event" | "job";
  entityId: string;
  baseScore: number;
  industry?: string | null;
  metadata?: Record<string, unknown>;
};

export type ScoredRecommendation = RecommendationCandidate & {
  score: number;
  reason: string;
};

export function scoreRecommendations(
  signals: RecommendationSignal,
  candidates: RecommendationCandidate[],
): ScoredRecommendation[] {
  return candidates
    .map((c) => {
      let score = c.baseScore;
      const reasons: string[] = [];

      if (
        signals.industry &&
        c.industry &&
        signals.industry.toLowerCase() === c.industry.toLowerCase()
      ) {
        score += 25;
        reasons.push("Same industry");
      }

      if (
        signals.followedBusinessIds?.includes(c.entityId) ||
        signals.connectionBusinessIds?.includes(c.entityId)
      ) {
        score += 20;
        reasons.push("In your network");
      }

      if (signals.marketplaceActivityScore && signals.marketplaceActivityScore > 0) {
        score += Math.min(15, signals.marketplaceActivityScore);
        reasons.push("Active in marketplace");
      }

      if (signals.recentPurchaseCategories?.length) {
        score += 5;
        reasons.push("Based on purchase history");
      }

      return {
        ...c,
        score,
        reason: reasons.length ? reasons.join(" · ") : "Recommended for you",
      };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function topN(
  recommendations: ScoredRecommendation[],
  limit = 20,
): ScoredRecommendation[] {
  return recommendations.slice(0, limit);
}
