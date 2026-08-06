import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  PulseActivity,
  PulseFeed,
  PulseFeedItem,
  PulseItemSource,
  PulseItemType,
  PulseRecommendation,
  PulseTimeline,
  PulseTrendingBusiness,
} from "./types";

function db() {
  return createAdminClient();
}

export async function getPlatformFeed(): Promise<PulseFeed | null> {
  const { data } = await db()
    .from("atlas_pulse_feeds")
    .select("*")
    .eq("scope", "platform")
    .is("owner_id", null)
    .limit(1)
    .maybeSingle();
  return (data as PulseFeed | null) ?? null;
}

export async function getTimelineByBusinessId(
  businessId: string,
): Promise<PulseTimeline | null> {
  const { data } = await db()
    .from("atlas_pulse_timelines")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();
  return (data as PulseTimeline | null) ?? null;
}

export async function getFeedByBusinessId(
  businessId: string,
): Promise<PulseFeed | null> {
  const { data } = await db()
    .from("atlas_pulse_feeds")
    .select("*")
    .eq("business_id", businessId)
    .eq("scope", "business")
    .maybeSingle();
  return (data as PulseFeed | null) ?? null;
}

export async function ensureBusinessPulseFeed(input: {
  businessId: string;
  ownerUserId: string;
  title: string;
}): Promise<{ feed: PulseFeed; timeline: PulseTimeline }> {
  let feed = await getFeedByBusinessId(input.businessId);
  let timeline = await getTimelineByBusinessId(input.businessId);

  if (!feed) {
    const { data, error } = await db()
      .from("atlas_pulse_feeds")
      .insert({
        scope: "business",
        owner_id: input.ownerUserId,
        business_id: input.businessId,
        title: input.title,
        metadata: { source: "ensureBusinessPulseFeed" },
      })
      .select("*")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to create feed");
    feed = data as PulseFeed;
  }

  if (!timeline) {
    const { data, error } = await db()
      .from("atlas_pulse_timelines")
      .insert({ business_id: input.businessId, feed_id: feed.id })
      .select("*")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to create timeline");
    timeline = data as PulseTimeline;
  }

  return { feed, timeline };
}

export async function createFeedItemRecord(input: {
  feedId: string;
  businessId?: string | null;
  actorUserId?: string | null;
  itemType: PulseItemType;
  source: PulseItemSource;
  sourceEvent?: string | null;
  sourceEntityType?: string | null;
  sourceEntityId?: string | null;
  title: string;
  summary?: string | null;
  body?: string | null;
  payload?: Record<string, unknown>;
  trendingScore?: number;
  engagementScore?: number;
}): Promise<PulseFeedItem> {
  const { data, error } = await db()
    .from("atlas_pulse_feed_items")
    .insert({
      feed_id: input.feedId,
      business_id: input.businessId ?? null,
      actor_user_id: input.actorUserId ?? null,
      item_type: input.itemType,
      source: input.source,
      source_event: input.sourceEvent ?? null,
      source_entity_type: input.sourceEntityType ?? null,
      source_entity_id: input.sourceEntityId ?? null,
      title: input.title,
      summary: input.summary ?? null,
      body: input.body ?? null,
      payload: input.payload ?? {},
      trending_score: input.trendingScore ?? 0,
      engagement_score: input.engagementScore ?? 0,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create feed item");
  return data as PulseFeedItem;
}

export async function bumpTimelineActivity(
  businessId: string,
): Promise<void> {
  const timeline = await getTimelineByBusinessId(businessId);
  if (!timeline) return;
  await db()
    .from("atlas_pulse_timelines")
    .update({
      last_activity_at: new Date().toISOString(),
      item_count: timeline.item_count + 1,
    })
    .eq("id", timeline.id);
}

export async function createActivityRecord(input: {
  businessId?: string | null;
  actorUserId?: string | null;
  activityType: string;
  source: PulseItemSource;
  sourceEvent?: string | null;
  payload?: Record<string, unknown>;
  feedItemId?: string | null;
}): Promise<PulseActivity> {
  const { data, error } = await db()
    .from("atlas_pulse_activities")
    .insert({
      business_id: input.businessId ?? null,
      actor_user_id: input.actorUserId ?? null,
      activity_type: input.activityType,
      source: input.source,
      source_event: input.sourceEvent ?? null,
      payload: input.payload ?? {},
      feed_item_id: input.feedItemId ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to record activity");
  return data as PulseActivity;
}

export async function upsertTrendingBusiness(input: {
  businessId: string;
  score: number;
  industry?: string | null;
  rank?: number | null;
}): Promise<PulseTrendingBusiness> {
  const windowStart = new Date();
  windowStart.setHours(0, 0, 0, 0);
  const { data, error } = await db()
    .from("atlas_pulse_trending_businesses")
    .upsert(
      {
        business_id: input.businessId,
        score: input.score,
        industry: input.industry ?? null,
        rank: input.rank ?? null,
        window_start: windowStart.toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "business_id,window_start" },
    )
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to upsert trending");
  return data as PulseTrendingBusiness;
}

export async function upsertTrendingProduct(input: {
  productId: string;
  businessId?: string | null;
  score: number;
}): Promise<void> {
  const windowStart = new Date();
  windowStart.setHours(0, 0, 0, 0);
  await db().from("atlas_pulse_trending_products").insert({
    product_id: input.productId,
    business_id: input.businessId ?? null,
    score: input.score,
    window_start: windowStart.toISOString(),
    updated_at: new Date().toISOString(),
  });
}

export async function saveRecommendations(
  rows: Array<{
    targetUserId?: string | null;
    targetBusinessId?: string | null;
    entityType: string;
    entityId: string;
    score: number;
    reason?: string | null;
    metadata?: Record<string, unknown>;
  }>,
): Promise<void> {
  if (!rows.length) return;
  await db().from("atlas_pulse_recommendations").insert(
    rows.map((r) => ({
      target_user_id: r.targetUserId ?? null,
      target_business_id: r.targetBusinessId ?? null,
      recommended_entity_type: r.entityType,
      recommended_entity_id: r.entityId,
      score: r.score,
      reason: r.reason ?? null,
      metadata: r.metadata ?? {},
    })),
  );
}

export async function getFeedItems(input: {
  feedId: string;
  limit?: number;
  offset?: number;
}): Promise<PulseFeedItem[]> {
  const { data } = await db()
    .from("atlas_pulse_feed_items")
    .select("*")
    .eq("feed_id", input.feedId)
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .range(input.offset ?? 0, (input.offset ?? 0) + (input.limit ?? 20) - 1);
  return (data ?? []) as PulseFeedItem[];
}

export async function getTrendingBusinesses(
  limit = 10,
): Promise<PulseTrendingBusiness[]> {
  const { data } = await db()
    .from("atlas_pulse_trending_businesses")
    .select("*")
    .order("score", { ascending: false })
    .limit(limit);
  return (data ?? []) as PulseTrendingBusiness[];
}

export async function getRecommendationsForUser(
  userId: string,
  limit = 20,
): Promise<PulseRecommendation[]> {
  const { data } = await db()
    .from("atlas_pulse_recommendations")
    .select("*")
    .eq("target_user_id", userId)
    .order("score", { ascending: false })
    .limit(limit);
  return (data ?? []) as PulseRecommendation[];
}

export async function initItemAnalytics(feedItemId: string): Promise<void> {
  await db()
    .from("atlas_pulse_item_analytics")
    .upsert({ feed_item_id: feedItemId }, { onConflict: "feed_item_id" });
}
