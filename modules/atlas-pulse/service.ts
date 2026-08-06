import "server-only";

import { randomUUID } from "node:crypto";
import { publishDomainEvent, type DomainEvent } from "@/domains";
import type { AtlasPulsePort, PulseFeedItemRecord } from "@/domains/contracts/ports";
import { computeTrendingScore } from "./ranking";
import { scoreRecommendations, topN, type RecommendationCandidate } from "./recommendations";
import {
  bumpTimelineActivity,
  createActivityRecord,
  createFeedItemRecord,
  ensureBusinessPulseFeed,
  getFeedByBusinessId,
  getFeedItems,
  getPlatformFeed,
  getRecommendationsForUser,
  getTimelineByBusinessId,
  getTrendingBusinesses,
  initItemAnalytics,
  saveRecommendations,
  upsertTrendingBusiness,
  upsertTrendingProduct,
} from "./repository";
import type { IngestPulseEventInput, PulseFeedItem } from "./types";
import { PULSE_EVENT_MAP as EVENT_MAP } from "./types";

async function emit(
  name: DomainEvent["name"],
  input: {
    actorId: string | null;
    businessId: string | null;
    payload: Record<string, unknown>;
  },
) {
  await publishDomainEvent({
    id: randomUUID(),
    name,
    occurredAt: new Date(),
    actorId: input.actorId,
    businessId: input.businessId,
    payload: input.payload,
    correlationId: randomUUID(),
  });
}

function toRecord(item: PulseFeedItem): PulseFeedItemRecord {
  return {
    id: item.id,
    feedId: item.feed_id,
    businessId: item.business_id,
    itemType: item.item_type,
    source: item.source,
    title: item.title ?? "",
    summary: item.summary,
    trendingScore: item.trending_score,
    publishedAt: new Date(item.published_at),
  };
}

/** Ensure business owns a Pulse feed + timeline (idempotent). */
export async function ensureBusinessPulse(input: {
  businessId: string;
  ownerUserId: string;
  displayName: string;
}) {
  return ensureBusinessPulseFeed({
    businessId: input.businessId,
    ownerUserId: input.ownerUserId,
    title: `${input.displayName} Pulse`,
  });
}

/** Ingest any ecosystem event into Pulse feeds. */
export async function ingestPulseEvent(
  input: IngestPulseEventInput,
): Promise<PulseFeedItem | null> {
  const feeds: string[] = [];

  if (input.businessId) {
    const feed = await getFeedByBusinessId(input.businessId);
    if (feed) feeds.push(feed.id);
  }

  const platform = await getPlatformFeed();
  if (platform) feeds.push(platform.id);

  if (!feeds.length) return null;

  const trendingScore = computeTrendingScore({
    viewCount: 0,
    reactionCount: 0,
    commentCount: 0,
    shareCount: 0,
    bookmarkCount: 0,
    publishedAt: new Date(),
  });

  const primaryFeedId = feeds[0];
  const item = await createFeedItemRecord({
    feedId: primaryFeedId,
    businessId: input.businessId,
    actorUserId: input.actorUserId,
    itemType: input.itemType,
    source: input.source,
    sourceEvent: input.sourceEvent,
    sourceEntityType: input.sourceEntityType,
    sourceEntityId: input.sourceEntityId,
    title: input.title,
    summary: input.summary,
    payload: input.payload,
    trendingScore,
    engagementScore: trendingScore,
  });

  await initItemAnalytics(item.id);

  await createActivityRecord({
    businessId: input.businessId,
    actorUserId: input.actorUserId,
    activityType: input.itemType,
    source: input.source,
    sourceEvent: input.sourceEvent,
    payload: input.payload ?? {},
    feedItemId: item.id,
  });

  if (input.businessId) {
    await bumpTimelineActivity(input.businessId);
    await upsertTrendingBusiness({
      businessId: input.businessId,
      score: trendingScore,
    });
  }

  if (input.sourceEntityType === "product" && input.sourceEntityId) {
    await upsertTrendingProduct({
      productId: input.sourceEntityId,
      businessId: input.businessId,
      score: trendingScore,
    });
  }

  await emit("pulse.feed_item_created", {
    actorId: input.actorUserId ?? null,
    businessId: input.businessId ?? null,
    payload: { feedItemId: item.id, itemType: input.itemType, sourceEvent: input.sourceEvent },
  });

  return item;
}

/** Map a platform domain event name → Pulse ingestion. */
export async function ingestFromDomainEvent(event: {
  name: string;
  actorId: string | null;
  businessId: string | null;
  payload: Record<string, unknown>;
}): Promise<PulseFeedItem | null> {
  const mapping = EVENT_MAP[event.name];
  if (!mapping) return null;

  return ingestPulseEvent({
    sourceEvent: event.name,
    source: mapping.source,
    businessId: event.businessId,
    actorUserId: event.actorId,
    itemType: mapping.itemType,
    title: mapping.title(event.payload),
    summary: typeof event.payload.summary === "string" ? event.payload.summary : undefined,
    payload: event.payload,
    sourceEntityType: typeof event.payload.entityType === "string"
      ? event.payload.entityType
      : undefined,
    sourceEntityId: typeof event.payload.entityId === "string"
      ? event.payload.entityId
      : typeof event.payload.productId === "string"
        ? event.payload.productId
        : typeof event.payload.storeId === "string"
          ? event.payload.storeId
          : undefined,
  });
}

export async function getBusinessPulseFeed(
  businessId: string,
  limit = 20,
): Promise<PulseFeedItemRecord[]> {
  const feed = await getFeedByBusinessId(businessId);
  if (!feed) return [];
  const items = await getFeedItems({ feedId: feed.id, limit });
  return items.map(toRecord);
}

export async function getDiscoveryFeed(limit = 20): Promise<PulseFeedItemRecord[]> {
  const platform = await getPlatformFeed();
  if (!platform) return [];
  const items = await getFeedItems({ feedId: platform.id, limit });
  return items.map(toRecord);
}

export async function generateRecommendations(input: {
  userId: string;
  signals: Parameters<typeof scoreRecommendations>[0];
  candidates: RecommendationCandidate[];
}): Promise<void> {
  const scored = topN(scoreRecommendations(input.signals, input.candidates));
  await saveRecommendations(
    scored.map((r) => ({
      targetUserId: input.userId,
      entityType: r.entityType,
      entityId: r.entityId,
      score: r.score,
      reason: r.reason,
      metadata: r.metadata,
    })),
  );
  await emit("pulse.recommendations_updated", {
    actorId: input.userId,
    businessId: null,
    payload: { count: scored.length },
  });
}

export function createAtlasPulsePort(): AtlasPulsePort {
  return {
    async getBusinessFeed(businessId, limit) {
      return getBusinessPulseFeed(businessId, limit);
    },
    async getDiscoveryFeed(limit) {
      return getDiscoveryFeed(limit);
    },
    async getTimeline(businessId) {
      const timeline = await getTimelineByBusinessId(businessId);
      return timeline
        ? {
            businessId: timeline.business_id,
            feedId: timeline.feed_id,
            itemCount: timeline.item_count,
            lastActivityAt: timeline.last_activity_at
              ? new Date(timeline.last_activity_at)
              : null,
          }
        : null;
    },
    async ingestEvent(event) {
      const item = await ingestFromDomainEvent(event);
      return item ? toRecord(item) : null;
    },
  };
}

export { computeTrendingScore } from "./ranking";
export { scoreRecommendations, topN } from "./recommendations";
