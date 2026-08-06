/**
 * ATLAS Pulse ranking engine — trending score computation.
 * Pure functions; no I/O. Replace with ML pipeline later without API changes.
 */

export type RankingInput = {
  viewCount: number;
  reactionCount: number;
  commentCount: number;
  shareCount: number;
  bookmarkCount: number;
  publishedAt: Date;
  isVerified?: boolean;
  isSponsored?: boolean;
};

const HOUR_MS = 3_600_000;

/** Time-decayed engagement score (Hacker News–style gravity). */
export function computeEngagementScore(input: RankingInput): number {
  const engagement =
    input.viewCount * 0.1 +
    input.reactionCount * 2 +
    input.commentCount * 3 +
    input.shareCount * 4 +
    input.bookmarkCount * 2.5;

  const ageHours = Math.max(
    1,
    (Date.now() - input.publishedAt.getTime()) / HOUR_MS,
  );
  const gravity = 1.8;
  let score = engagement / Math.pow(ageHours + 2, gravity);

  if (input.isVerified) score *= 1.15;
  if (input.isSponsored) score *= 0.85;

  return Math.round(score * 1000) / 1000;
}

export function computeTrendingScore(input: RankingInput): number {
  const base = computeEngagementScore(input);
  const recencyBoost =
    input.publishedAt.getTime() > Date.now() - 24 * HOUR_MS ? 1.25 : 1;
  return Math.round(base * recencyBoost * 1000) / 1000;
}

export function rankEntities<T extends { score: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.score - a.score);
}
