import { describe, expect, it } from "vitest";
import {
  computeEngagementScore,
  computeTrendingScore,
  rankEntities,
} from "@/modules/atlas-pulse/ranking";
import {
  scoreRecommendations,
  topN,
} from "@/modules/atlas-pulse/recommendations";
import {
  ownerOf,
  BOUNDED_CONTEXTS,
  DOMAIN_EVENTS,
  hasPermission,
  permissionsForPlatformRole,
  ATLAS_PULSE_MODULE,
} from "@/domains";
import { PULSE_EVENT_MAP } from "@/modules/atlas-pulse/types";
import { ATLAS_ROOT_MODULES } from "@/config/atlas-nav";

describe("ATLAS Pulse bounded context", () => {
  it("registers atlasPulse as active context", () => {
    expect(BOUNDED_CONTEXTS.atlasPulse.id).toBe("atlas_pulse");
    expect(BOUNDED_CONTEXTS.atlasPulse.atlasModule).toBe("feed");
    expect(BOUNDED_CONTEXTS.atlasPulse.owns).toContain("PulseFeedItem");
  });

  it("owns intelligence feed aggregates — not Network social entities", () => {
    expect(ownerOf("PulseFeedItem")).toBe("atlasPulse");
    expect(ownerOf("TrendingBusiness")).toBe("atlasPulse");
    expect(ownerOf("Post")).toBe("atlasNetwork");
    expect(ownerOf("Product")).toBe("businessHub");
  });

  it("declares Pulse module metadata", () => {
    expect(ATLAS_PULSE_MODULE.publicName).toBe("Pulse");
    expect(ATLAS_PULSE_MODULE.internalModulePath).toBe("modules/atlas-pulse");
  });

  it("maps feed nav to atlasPulse", () => {
    const feed = ATLAS_ROOT_MODULES.find((m) => m.id === "feed");
    expect(feed?.label).toBe("Pulse");
    expect(feed?.boundedContext).toBe("atlasPulse");
  });
});

describe("ATLAS Pulse ranking engine", () => {
  it("scores higher engagement higher", () => {
    const low = computeEngagementScore({
      viewCount: 10,
      reactionCount: 1,
      commentCount: 0,
      shareCount: 0,
      bookmarkCount: 0,
      publishedAt: new Date(),
    });
    const high = computeEngagementScore({
      viewCount: 100,
      reactionCount: 20,
      commentCount: 10,
      shareCount: 5,
      bookmarkCount: 3,
      publishedAt: new Date(),
    });
    expect(high).toBeGreaterThan(low);
  });

  it("applies recency boost in trending score", () => {
    const recent = computeTrendingScore({
      viewCount: 50,
      reactionCount: 5,
      commentCount: 2,
      shareCount: 1,
      bookmarkCount: 1,
      publishedAt: new Date(),
    });
    const old = computeTrendingScore({
      viewCount: 50,
      reactionCount: 5,
      commentCount: 2,
      shareCount: 1,
      bookmarkCount: 1,
      publishedAt: new Date(Date.now() - 7 * 86400000),
    });
    expect(recent).toBeGreaterThan(old);
  });

  it("ranks entities by score descending", () => {
    const ranked = rankEntities([{ score: 10 }, { score: 50 }, { score: 25 }]);
    expect(ranked.map((r) => r.score)).toEqual([50, 25, 10]);
  });
});

describe("ATLAS Pulse recommendation engine", () => {
  it("boosts same-industry candidates", () => {
    const results = scoreRecommendations(
      { industry: "retail" },
      [
        { entityType: "business", entityId: "a", baseScore: 10, industry: "retail" },
        { entityType: "business", entityId: "b", baseScore: 10, industry: "finance" },
      ],
    );
    expect(results[0].entityId).toBe("a");
    expect(results[0].reason).toContain("Same industry");
  });

  it("returns top N recommendations", () => {
    const scored = scoreRecommendations(
      {},
      Array.from({ length: 30 }, (_, i) => ({
        entityType: "business" as const,
        entityId: String(i),
        baseScore: i,
      })),
    );
    expect(topN(scored, 5)).toHaveLength(5);
  });
});

describe("ATLAS Pulse events & permissions", () => {
  it("catalogs pulse domain events", () => {
    expect(DOMAIN_EVENTS).toContain("pulse.feed_item_created");
    expect(DOMAIN_EVENTS).toContain("pulse.recommendations_updated");
  });

  it("maps ecosystem events to pulse ingestion", () => {
    expect(PULSE_EVENT_MAP["product.created"]).toBeDefined();
    expect(PULSE_EVENT_MAP["order.paid"]).toBeDefined();
  });

  it("grants business role pulse management", () => {
    const perms = permissionsForPlatformRole("business");
    expect(hasPermission(perms, "pulse:feed:manage")).toBe(true);
    expect(hasPermission(perms, "pulse:article:publish")).toBe(true);
  });
});
