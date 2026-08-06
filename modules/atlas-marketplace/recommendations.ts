/**
 * ATLAS Marketplace — recommendation heuristics (pure).
 */

export type ListingCandidate = {
  listingId: string;
  score: number;
  sellingType?: string;
  categoryId?: string | null;
  isFeatured?: boolean;
  isSponsored?: boolean;
};

export type RecommendationSignals = {
  recentCategoryIds?: string[];
  recentListingIds?: string[];
  preferFeatured?: boolean;
};

export type ScoredListingRecommendation = ListingCandidate & {
  reason: string;
};

export function scoreListingRecommendations(
  signals: RecommendationSignals,
  candidates: ListingCandidate[],
): ScoredListingRecommendation[] {
  return candidates
    .map((c) => {
      let score = c.score;
      const reasons: string[] = [];
      if (c.isFeatured) {
        score += 15;
        reasons.push("Featured");
      }
      if (c.isSponsored) {
        score += 10;
        reasons.push("Sponsored");
      }
      if (
        c.categoryId &&
        signals.recentCategoryIds?.includes(c.categoryId)
      ) {
        score += 20;
        reasons.push("Similar category");
      }
      if (signals.recentListingIds?.includes(c.listingId)) {
        score -= 30;
        reasons.push("Already viewed");
      }
      if (signals.preferFeatured && c.isFeatured) {
        score += 5;
      }
      return {
        ...c,
        score,
        reason: reasons.join(", ") || "General match",
      };
    })
    .sort((a, b) => b.score - a.score);
}
