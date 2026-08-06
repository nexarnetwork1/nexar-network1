/**
 * ATLAS Apps — AI recommendation contracts (pure).
 */

import type { AppCategorySlug } from "./types";

export type AppRecommendationSignal = {
  industry?: string | null;
  hasProducts?: boolean;
  hasOrders?: boolean;
  employeeCount?: number;
  installedSlugs?: string[];
};

export type AppRecommendationCandidate = {
  applicationId: string;
  slug: string;
  categorySlug: AppCategorySlug;
  baseScore: number;
  isFeatured?: boolean;
  isVerified?: boolean;
};

export type ScoredAppRecommendation = AppRecommendationCandidate & {
  score: number;
  reason: string;
};

export function recommendApps(
  signals: AppRecommendationSignal,
  candidates: AppRecommendationCandidate[],
): ScoredAppRecommendation[] {
  const installed = new Set(signals.installedSlugs ?? []);
  return candidates
    .filter((c) => !installed.has(c.slug))
    .map((c) => {
      let score = c.baseScore;
      const reasons: string[] = [];
      if (c.isFeatured) {
        score += 15;
        reasons.push("Featured");
      }
      if (c.isVerified) {
        score += 10;
        reasons.push("Verified");
      }
      if (signals.hasProducts && (c.categorySlug === "inventory" || c.categorySlug === "pos")) {
        score += 25;
        reasons.push("You sell products");
      }
      if (signals.hasOrders && (c.categorySlug === "crm" || c.categorySlug === "support")) {
        score += 20;
        reasons.push("You have orders");
      }
      if ((signals.employeeCount ?? 0) > 5 && c.categorySlug === "hr") {
        score += 20;
        reasons.push("Growing team");
      }
      if (c.categorySlug === "ai") {
        score += 8;
        reasons.push("AI native");
      }
      return {
        ...c,
        score,
        reason: reasons.join(", ") || "General fit",
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function recommendStarterApps(): AppCategorySlug[] {
  return ["crm", "finance", "inventory", "analytics"];
}
