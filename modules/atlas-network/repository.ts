import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  NetworkActivity,
  NetworkComment,
  NetworkCompanyProfile,
  NetworkConnection,
  CompanyAnalyticsSummary,
  NetworkEvent,
  NetworkFeedPost,
  NetworkFollow,
  NetworkPage,
  NetworkPersonProfile,
  NetworkPoll,
  NetworkPollOption,
  NetworkPost,
  NetworkPostMedia,
  NetworkProfile,
  NetworkProfileKind,
  NetworkPrivacyLevel,
  NetworkReaction,
} from "./types";

function db() {
  return createAdminClient();
}

export async function getNetworkProfileById(
  id: string,
): Promise<NetworkProfile | null> {
  const { data } = await db()
    .from("atlas_network_profiles")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  return (data as NetworkProfile | null) ?? null;
}

export async function getNetworkProfileBySlug(
  slug: string,
): Promise<NetworkProfile | null> {
  const { data } = await db()
    .from("atlas_network_profiles")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  return (data as NetworkProfile | null) ?? null;
}

export async function getNetworkProfileByBusinessId(
  businessId: string,
): Promise<NetworkProfile | null> {
  const { data } = await db()
    .from("atlas_network_company_profiles")
    .select("network_profile_id")
    .eq("business_id", businessId)
    .maybeSingle();
  if (!data) return null;
  return getNetworkProfileById(
    (data as { network_profile_id: string }).network_profile_id,
  );
}

export async function getCompanyProfileByBusinessId(
  businessId: string,
): Promise<NetworkCompanyProfile | null> {
  const { data } = await db()
    .from("atlas_network_company_profiles")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();
  return (data as NetworkCompanyProfile | null) ?? null;
}

export async function getPersonProfileByUserId(
  userId: string,
): Promise<NetworkPersonProfile | null> {
  const { data } = await db()
    .from("atlas_network_person_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as NetworkPersonProfile | null) ?? null;
}

export async function getPageByBusinessId(
  businessId: string,
): Promise<NetworkPage | null> {
  const { data } = await db()
    .from("atlas_network_pages")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();
  return (data as NetworkPage | null) ?? null;
}

export async function resolveUniqueNetworkSlug(base: string): Promise<string> {
  const slug =
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "profile";
  let n = 0;
  while (true) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const { data } = await db()
      .from("atlas_network_profiles")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
    n += 1;
  }
}

export async function createNetworkProfileRecord(input: {
  subjectType: NetworkProfile["subject_type"];
  subjectId: string;
  profileKind: NetworkProfileKind;
  slug: string;
  displayName: string;
  headline?: string | null;
  avatarUrl?: string | null;
  ownerUserId: string;
  businessId?: string | null;
  privacy?: NetworkPrivacyLevel;
  profileData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): Promise<NetworkProfile> {
  const { data, error } = await db()
    .from("atlas_network_profiles")
    .insert({
      subject_type: input.subjectType,
      subject_id: input.subjectId,
      profile_kind: input.profileKind,
      slug: input.slug,
      display_name: input.displayName,
      headline: input.headline ?? null,
      avatar_url: input.avatarUrl ?? null,
      owner_user_id: input.ownerUserId,
      business_id: input.businessId ?? null,
      privacy: input.privacy ?? "public",
      profile_data: input.profileData ?? {},
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create profile");
  return data as NetworkProfile;
}

export async function createCompanyProfileRecord(input: {
  businessId: string;
  networkProfileId: string;
  industry?: string | null;
  website?: string | null;
}): Promise<NetworkCompanyProfile> {
  const { data, error } = await db()
    .from("atlas_network_company_profiles")
    .insert({
      business_id: input.businessId,
      network_profile_id: input.networkProfileId,
      industry: input.industry ?? null,
      website: input.website ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create company profile");
  return data as NetworkCompanyProfile;
}

export async function createPageRecord(input: {
  networkProfileId: string;
  businessId?: string | null;
  pageType?: string;
}): Promise<NetworkPage> {
  const { data, error } = await db()
    .from("atlas_network_pages")
    .insert({
      network_profile_id: input.networkProfileId,
      business_id: input.businessId ?? null,
      page_type: input.pageType ?? "company",
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create page");
  return data as NetworkPage;
}

export async function createPersonProfileRecord(input: {
  userId: string;
  networkProfileId: string;
}): Promise<NetworkPersonProfile> {
  const { data, error } = await db()
    .from("atlas_network_person_profiles")
    .insert({
      user_id: input.userId,
      network_profile_id: input.networkProfileId,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create person profile");
  return data as NetworkPersonProfile;
}

export async function createFollowRecord(input: {
  followerProfileId: string;
  targetType: NetworkFollow["target_type"];
  targetId: string;
}): Promise<NetworkFollow> {
  const { data, error } = await db()
    .from("atlas_network_follows")
    .insert({
      follower_profile_id: input.followerProfileId,
      target_type: input.targetType,
      target_id: input.targetId,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to follow");
  return data as NetworkFollow;
}

export async function createConnectionRecord(input: {
  requesterProfileId: string;
  recipientProfileId: string;
  connectionKind: NetworkConnection["connection_kind"];
  message?: string | null;
}): Promise<NetworkConnection> {
  const { data, error } = await db()
    .from("atlas_network_connections")
    .insert({
      requester_profile_id: input.requesterProfileId,
      recipient_profile_id: input.recipientProfileId,
      connection_kind: input.connectionKind,
      message: input.message ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create connection");
  return data as NetworkConnection;
}

export async function updateConnectionStatus(
  id: string,
  status: NetworkConnection["status"],
): Promise<NetworkConnection> {
  const { data, error } = await db()
    .from("atlas_network_connections")
    .update({
      status,
      responded_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to update connection");
  return data as NetworkConnection;
}

export async function createPostRecord(input: {
  authorProfileId: string;
  businessId?: string | null;
  postType: NetworkPost["post_type"];
  title?: string | null;
  body?: string | null;
  visibility?: NetworkPost["visibility"];
  metadata?: Record<string, unknown>;
  publish?: boolean;
}): Promise<NetworkPost> {
  const { data, error } = await db()
    .from("atlas_network_posts")
    .insert({
      author_profile_id: input.authorProfileId,
      business_id: input.businessId ?? null,
      post_type: input.postType,
      title: input.title ?? null,
      body: input.body ?? null,
      visibility: input.visibility ?? "public",
      metadata: input.metadata ?? {},
      published_at: input.publish !== false ? new Date().toISOString() : null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create post");
  return data as NetworkPost;
}

export async function createActivityRecord(input: {
  activityType: NetworkActivity["activity_type"];
  actorProfileId?: string | null;
  businessId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  payload?: Record<string, unknown>;
}): Promise<NetworkActivity> {
  const { data, error } = await db()
    .from("atlas_network_activities")
    .insert({
      activity_type: input.activityType,
      actor_profile_id: input.actorProfileId ?? null,
      business_id: input.businessId ?? null,
      target_type: input.targetType ?? null,
      target_id: input.targetId ?? null,
      payload: input.payload ?? {},
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to record activity");
  return data as NetworkActivity;
}

export async function addTimelineEntry(input: {
  feedOwnerProfileId: string;
  activityId?: string | null;
  postId?: string | null;
  score?: number;
}): Promise<void> {
  const { error } = await db().from("atlas_network_timeline_entries").insert({
    feed_owner_profile_id: input.feedOwnerProfileId,
    activity_id: input.activityId ?? null,
    post_id: input.postId ?? null,
    score: input.score ?? 0,
  });
  if (error) throw new Error(error.message);
}

export async function incrementFollowerCount(profileId: string): Promise<void> {
  const { data } = await db()
    .from("atlas_network_profiles")
    .select("follower_count")
    .eq("id", profileId)
    .single();
  if (!data) return;
  await db()
    .from("atlas_network_profiles")
    .update({
      follower_count: ((data as { follower_count: number }).follower_count ?? 0) + 1,
    })
    .eq("id", profileId);
}

export async function getNetworkPosts(input: {
  limit?: number;
  offset?: number;
  authorProfileId?: string;
  businessId?: string;
  postType?: NetworkPost["post_type"];
  includeComments?: boolean;
  viewerProfileId?: string;
}): Promise<NetworkFeedPost[]> {
  let query = db()
    .from("atlas_network_posts")
    .select(`
      *,
      author:atlas_network_profiles!atlas_network_posts_author_profile_id_fkey (
        id,
        display_name,
        avatar_url,
        verified,
        subject_type,
        slug
      ),
      business:businesses!atlas_network_posts_business_id_fkey (
        id,
        display_name,
        legal_name,
        logo_url,
        slug
      )
    `)
    .eq("visibility", "public")
    .is("deleted_at", null)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

  if (input.authorProfileId) {
    query = query.eq("author_profile_id", input.authorProfileId);
  }

  if (input.businessId) {
    query = query.eq("business_id", input.businessId);
  }

  if (input.postType) {
    query = query.eq("post_type", input.postType);
  }

  const limit = input.limit ?? 20;
  if (input.offset) {
    query = query.range(input.offset, input.offset + limit - 1);
  } else {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const posts = (data ?? []) as NetworkFeedPost[];
  if (posts.length === 0) return [];

  const postIds = posts.map((p) => p.id);

  const [{ data: mediaRows }, { data: pollRows }] = await Promise.all([
    db()
      .from("atlas_network_post_media")
      .select("*")
      .in("post_id", postIds)
      .order("sort_order", { ascending: true }),
    db()
      .from("atlas_network_polls")
      .select("*")
      .in("post_id", postIds),
  ]);

  const pollIds = (pollRows ?? []).map((p) => (p as NetworkPoll).id);
  let pollOptions: NetworkPollOption[] = [];
  if (pollIds.length > 0) {
    const { data: options } = await db()
      .from("atlas_network_poll_options")
      .select("*")
      .in("poll_id", pollIds)
      .order("sort_order", { ascending: true });
    pollOptions = (options ?? []) as NetworkPollOption[];
  }

  const eventPostIds = posts.filter((p) => p.post_type === "event").map((p) => p.id);
  let events: NetworkEvent[] = [];
  if (eventPostIds.length > 0) {
    const { data: eventRows } = await db()
      .from("atlas_network_events")
      .select("*")
      .in("post_id", eventPostIds);
    events = (eventRows ?? []) as NetworkEvent[];
  }

  let viewerReactions: NetworkReaction[] = [];
  if (input.viewerProfileId) {
    const { data: reactions } = await db()
      .from("atlas_network_reactions")
      .select("*")
      .eq("target_type", "post")
      .eq("profile_id", input.viewerProfileId)
      .in("target_id", postIds);
    viewerReactions = (reactions ?? []) as NetworkReaction[];
  }

  let commentsByPost: Record<string, NetworkFeedPost["comments"]> = {};
  if (input.includeComments) {
    const { data: commentRows } = await db()
      .from("atlas_network_comments")
      .select(`
        *,
        author:atlas_network_profiles!atlas_network_comments_author_profile_id_fkey (
          id,
          display_name,
          avatar_url
        )
      `)
      .in("post_id", postIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(200);

    for (const row of commentRows ?? []) {
      const comment = row as NetworkComment & {
        author?: { id: string; display_name: string; avatar_url: string | null };
      };
      if (!commentsByPost[comment.post_id]) commentsByPost[comment.post_id] = [];
      commentsByPost[comment.post_id]!.push(comment);
    }
  }

  return posts.map((post) => {
    const poll = (pollRows ?? []).find(
      (p) => (p as NetworkPoll).post_id === post.id,
    ) as NetworkPoll | undefined;
    return {
      ...post,
      media: ((mediaRows ?? []) as NetworkPostMedia[]).filter((m) => m.post_id === post.id),
      poll: poll
        ? {
            ...poll,
            options: pollOptions.filter((o) => o.poll_id === poll.id),
          }
        : undefined,
      event: events.find((e) => e.post_id === post.id) ?? null,
      comments: commentsByPost[post.id] ?? [],
      user_reacted: viewerReactions.some((r) => r.target_id === post.id),
    };
  });
}

export async function getNetworkPostById(
  postId: string,
  viewerProfileId?: string,
): Promise<NetworkFeedPost | null> {
  const { data, error } = await db()
    .from("atlas_network_posts")
    .select(`
      *,
      author:atlas_network_profiles!atlas_network_posts_author_profile_id_fkey (
        id, display_name, avatar_url, verified, subject_type, slug
      ),
      business:businesses!atlas_network_posts_business_id_fkey (
        id, display_name, legal_name, logo_url, slug
      )
    `)
    .eq("id", postId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) return null;

  const enriched = await getNetworkPosts({
    limit: 50,
    includeComments: true,
    viewerProfileId,
  });
  return enriched.find((p) => p.id === postId) ?? (data as NetworkFeedPost);
}

export async function createPostMediaRecords(
  postId: string,
  media: Array<{ url: string; mediaType: string; thumbnailUrl?: string }>,
): Promise<NetworkPostMedia[]> {
  if (media.length === 0) return [];
  const rows = media.map((item, index) => ({
    post_id: postId,
    media_url: item.url,
    media_type: item.mediaType,
    sort_order: index,
    metadata: item.thumbnailUrl ? { thumbnail_url: item.thumbnailUrl } : {},
  }));
  const { data, error } = await db()
    .from("atlas_network_post_media")
    .insert(rows)
    .select("*");
  if (error) throw new Error(error.message);
  return (data ?? []) as NetworkPostMedia[];
}

export async function createCommentRecord(input: {
  postId: string;
  authorProfileId: string;
  body: string;
  parentId?: string | null;
}): Promise<NetworkComment> {
  const { data, error } = await db()
    .from("atlas_network_comments")
    .insert({
      post_id: input.postId,
      author_profile_id: input.authorProfileId,
      body: input.body,
      parent_id: input.parentId ?? null,
      depth: input.parentId ? 1 : 0,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create comment");

  const { data: post } = await db()
    .from("atlas_network_posts")
    .select("comment_count")
    .eq("id", input.postId)
    .single();
  if (post) {
    await db()
      .from("atlas_network_posts")
      .update({
        comment_count: ((post as { comment_count: number }).comment_count ?? 0) + 1,
      })
      .eq("id", input.postId);
  }

  return data as NetworkComment;
}

export async function getReactionForTarget(input: {
  targetType: "post" | "comment";
  targetId: string;
  profileId: string;
}): Promise<NetworkReaction | null> {
  const { data } = await db()
    .from("atlas_network_reactions")
    .select("*")
    .eq("target_type", input.targetType)
    .eq("target_id", input.targetId)
    .eq("profile_id", input.profileId)
    .maybeSingle();
  return (data as NetworkReaction | null) ?? null;
}

export async function toggleReactionRecord(input: {
  targetType: "post" | "comment";
  targetId: string;
  profileId: string;
  reactionType?: NetworkReaction["reaction_type"];
}): Promise<{ reacted: boolean; count: number }> {
  const existing = await getReactionForTarget(input);
  if (existing) {
    await db().from("atlas_network_reactions").delete().eq("id", existing.id);
    if (input.targetType === "post") {
      await decrementPostReaction(input.targetId, input.reactionType ?? "like");
    }
    const count = await countReactions(input.targetType, input.targetId);
    return { reacted: false, count };
  }

  await db().from("atlas_network_reactions").insert({
    target_type: input.targetType,
    target_id: input.targetId,
    profile_id: input.profileId,
    reaction_type: input.reactionType ?? "like",
  });

  if (input.targetType === "post") {
    await incrementPostReaction(input.targetId, input.reactionType ?? "like");
  }

  const count = await countReactions(input.targetType, input.targetId);
  return { reacted: true, count };
}

async function countReactions(
  targetType: "post" | "comment",
  targetId: string,
): Promise<number> {
  const { count } = await db()
    .from("atlas_network_reactions")
    .select("*", { count: "exact", head: true })
    .eq("target_type", targetType)
    .eq("target_id", targetId);
  return count ?? 0;
}

async function incrementPostReaction(
  postId: string,
  reactionType: NetworkReaction["reaction_type"],
): Promise<void> {
  const { data } = await db()
    .from("atlas_network_posts")
    .select("reaction_counts")
    .eq("id", postId)
    .single();
  if (!data) return;
  const counts = { ...((data as { reaction_counts: Record<string, number> }).reaction_counts ?? {}) };
  counts[reactionType] = (counts[reactionType] ?? 0) + 1;
  counts.like = Object.values(counts).reduce((a, b) => a + b, 0);
  await db().from("atlas_network_posts").update({ reaction_counts: counts }).eq("id", postId);
}

async function decrementPostReaction(
  postId: string,
  reactionType: NetworkReaction["reaction_type"],
): Promise<void> {
  const { data } = await db()
    .from("atlas_network_posts")
    .select("reaction_counts")
    .eq("id", postId)
    .single();
  if (!data) return;
  const counts = { ...((data as { reaction_counts: Record<string, number> }).reaction_counts ?? {}) };
  counts[reactionType] = Math.max(0, (counts[reactionType] ?? 0) - 1);
  counts.like = Object.values(counts).reduce((a, b) => a + b, 0);
  await db().from("atlas_network_posts").update({ reaction_counts: counts }).eq("id", postId);
}

export async function createPollRecord(input: {
  postId: string;
  options: string[];
  endsAt?: string | null;
  allowMultiple?: boolean;
}): Promise<NetworkPoll> {
  const { data: poll, error } = await db()
    .from("atlas_network_polls")
    .insert({
      post_id: input.postId,
      ends_at: input.endsAt ?? null,
      allow_multiple: input.allowMultiple ?? false,
    })
    .select("*")
    .single();
  if (error || !poll) throw new Error(error?.message ?? "Failed to create poll");

  const optionRows = input.options.map((label, index) => ({
    poll_id: (poll as NetworkPoll).id,
    label,
    sort_order: index,
  }));
  const { error: optError } = await db()
    .from("atlas_network_poll_options")
    .insert(optionRows);
  if (optError) throw new Error(optError.message);
  return poll as NetworkPoll;
}

export async function votePollRecord(input: {
  pollId: string;
  optionId: string;
  voterProfileId: string;
}): Promise<void> {
  const { error } = await db().from("atlas_network_poll_votes").insert({
    poll_id: input.pollId,
    option_id: input.optionId,
    voter_profile_id: input.voterProfileId,
  });
  if (error) {
    if (error.code === "23505") throw new Error("Already voted");
    throw new Error(error.message);
  }

  const { data: option } = await db()
    .from("atlas_network_poll_options")
    .select("vote_count")
    .eq("id", input.optionId)
    .single();
  if (option) {
    await db()
      .from("atlas_network_poll_options")
      .update({
        vote_count: ((option as { vote_count: number }).vote_count ?? 0) + 1,
      })
      .eq("id", input.optionId);
  }
}

export async function createEventRecord(input: {
  networkProfileId: string;
  postId?: string | null;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt?: string | null;
  location?: string | null;
  isOnline?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<NetworkEvent> {
  const { data, error } = await db()
    .from("atlas_network_events")
    .insert({
      network_profile_id: input.networkProfileId,
      post_id: input.postId ?? null,
      title: input.title,
      description: input.description ?? null,
      starts_at: input.startsAt,
      ends_at: input.endsAt ?? null,
      location: input.location ?? null,
      is_online: input.isOnline ?? false,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create event");
  return data as NetworkEvent;
}

export async function getUpcomingEvents(input: {
  limit?: number;
  from?: string;
}): Promise<(NetworkEvent & { profile?: NetworkProfile | null })[]> {
  const from = input.from ?? new Date().toISOString();
  const { data, error } = await db()
    .from("atlas_network_events")
    .select(`
      *,
      profile:atlas_network_profiles!atlas_network_events_network_profile_id_fkey (
        id, display_name, avatar_url, slug, verified
      )
    `)
    .gte("starts_at", from)
    .order("starts_at", { ascending: true })
    .limit(input.limit ?? 20);
  if (error) throw new Error(error.message);
  return (data ?? []) as (NetworkEvent & { profile?: NetworkProfile | null })[];
}

export async function getEventById(
  eventId: string,
): Promise<(NetworkEvent & { profile?: NetworkProfile | null; post?: NetworkPost | null }) | null> {
  const { data, error } = await db()
    .from("atlas_network_events")
    .select(`
      *,
      profile:atlas_network_profiles!atlas_network_events_network_profile_id_fkey (
        id, display_name, avatar_url, slug, verified
      ),
      post:atlas_network_posts!atlas_network_events_post_id_fkey (*)
    `)
    .eq("id", eventId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as (NetworkEvent & { profile?: NetworkProfile | null; post?: NetworkPost | null }) | null) ?? null;
}

export async function registerForEventRecord(input: {
  eventId: string;
  profileId: string;
  userId: string;
}): Promise<void> {
  const event = await getEventById(input.eventId);
  if (!event) throw new Error("Event not found");

  const registrations = (event.metadata.registrations as Array<{
    profile_id: string;
    user_id: string;
    registered_at: string;
  }>) ?? [];

  if (registrations.some((r) => r.profile_id === input.profileId)) {
    throw new Error("Already registered");
  }

  registrations.push({
    profile_id: input.profileId,
    user_id: input.userId,
    registered_at: new Date().toISOString(),
  });

  const { error } = await db()
    .from("atlas_network_events")
    .update({ metadata: { ...event.metadata, registrations } })
    .eq("id", input.eventId);
  if (error) throw new Error(error.message);
}

export async function applyToJobRecord(input: {
  postId: string;
  profileId: string;
  userId: string;
  message: string;
}): Promise<void> {
  const { data: post, error: fetchError } = await db()
    .from("atlas_network_posts")
    .select("metadata, post_type")
    .eq("id", input.postId)
    .single();
  if (fetchError || !post) throw new Error("Job not found");
  if ((post as { post_type: string }).post_type !== "job") {
    throw new Error("Not a job post");
  }

  const metadata = { ...((post as { metadata: Record<string, unknown> }).metadata ?? {}) };
  const applications = (metadata.applications as Array<{
    profile_id: string;
    user_id: string;
    message: string;
    applied_at: string;
    status?: string;
    updated_at?: string;
  }>) ?? [];

  if (applications.some((a) => a.profile_id === input.profileId)) {
    throw new Error("Already applied");
  }

  applications.push({
    profile_id: input.profileId,
    user_id: input.userId,
    message: input.message,
    applied_at: new Date().toISOString(),
    status: "pending",
  });

  const { error } = await db()
    .from("atlas_network_posts")
    .update({ metadata: { ...metadata, applications } })
    .eq("id", input.postId);
  if (error) throw new Error(error.message);
}

export async function updatePostMetadata(
  postId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  const { error } = await db()
    .from("atlas_network_posts")
    .update({ metadata })
    .eq("id", postId);
  if (error) throw new Error(error.message);
}

async function adjustProfileCount(
  profileId: string,
  field: "follower_count" | "following_count",
  delta: number,
): Promise<void> {
  const { data } = await db()
    .from("atlas_network_profiles")
    .select(field)
    .eq("id", profileId)
    .single();
  if (!data) return;
  const current = (data as Record<string, number>)[field] ?? 0;
  await db()
    .from("atlas_network_profiles")
    .update({ [field]: Math.max(0, current + delta) })
    .eq("id", profileId);
}

export async function updateNetworkProfileRecord(
  id: string,
  input: Partial<{
    display_name: string;
    headline: string | null;
    bio: string | null;
    avatar_url: string | null;
    cover_url: string | null;
    privacy: NetworkPrivacyLevel;
    profile_data: Record<string, unknown>;
  }>,
): Promise<NetworkProfile> {
  const { data, error } = await db()
    .from("atlas_network_profiles")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to update profile");
  return data as NetworkProfile;
}

export async function updatePersonProfileRecord(
  userId: string,
  input: Partial<{
    experience: unknown[];
    skills: unknown[];
    education: unknown[];
    certificates: unknown[];
    portfolio: Record<string, unknown>;
    current_position: Record<string, unknown>;
  }>,
): Promise<NetworkPersonProfile> {
  const { data, error } = await db()
    .from("atlas_network_person_profiles")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to update person profile");
  return data as NetworkPersonProfile;
}

export async function getPersonProfileByNetworkProfileId(
  networkProfileId: string,
): Promise<NetworkPersonProfile | null> {
  const { data } = await db()
    .from("atlas_network_person_profiles")
    .select("*")
    .eq("network_profile_id", networkProfileId)
    .maybeSingle();
  return (data as NetworkPersonProfile | null) ?? null;
}

export async function isFollowing(input: {
  followerProfileId: string;
  targetType: NetworkFollow["target_type"];
  targetId: string;
}): Promise<boolean> {
  const { data } = await db()
    .from("atlas_network_follows")
    .select("id")
    .eq("follower_profile_id", input.followerProfileId)
    .eq("target_type", input.targetType)
    .eq("target_id", input.targetId)
    .maybeSingle();
  return Boolean(data);
}

export async function deleteFollowRecord(input: {
  followerProfileId: string;
  targetType: NetworkFollow["target_type"];
  targetId: string;
}): Promise<void> {
  const { error } = await db()
    .from("atlas_network_follows")
    .delete()
    .eq("follower_profile_id", input.followerProfileId)
    .eq("target_type", input.targetType)
    .eq("target_id", input.targetId);
  if (error) throw new Error(error.message);
}

export async function decrementFollowerCount(profileId: string): Promise<void> {
  await adjustProfileCount(profileId, "follower_count", -1);
}

export async function incrementFollowingCount(profileId: string): Promise<void> {
  await adjustProfileCount(profileId, "following_count", 1);
}

export async function decrementFollowingCount(profileId: string): Promise<void> {
  await adjustProfileCount(profileId, "following_count", -1);
}

export async function listFollowers(
  profileId: string,
  limit = 20,
  offset = 0,
): Promise<NetworkProfile[]> {
  const { data: follows } = await db()
    .from("atlas_network_follows")
    .select("follower_profile_id")
    .eq("target_type", "profile")
    .eq("target_id", profileId)
    .range(offset, offset + limit - 1);
  const ids = (follows ?? []).map((f) => (f as { follower_profile_id: string }).follower_profile_id);
  if (ids.length === 0) return [];
  const { data } = await db()
    .from("atlas_network_profiles")
    .select("*")
    .in("id", ids)
    .is("deleted_at", null);
  return (data ?? []) as NetworkProfile[];
}

export async function listFollowing(
  profileId: string,
  limit = 20,
  offset = 0,
): Promise<NetworkProfile[]> {
  const { data: follows } = await db()
    .from("atlas_network_follows")
    .select("target_id, target_type")
    .eq("follower_profile_id", profileId)
    .eq("target_type", "profile")
    .range(offset, offset + limit - 1);
  const ids = (follows ?? []).map((f) => (f as { target_id: string }).target_id);
  if (ids.length === 0) return [];
  const { data } = await db()
    .from("atlas_network_profiles")
    .select("*")
    .in("id", ids)
    .is("deleted_at", null);
  return (data ?? []) as NetworkProfile[];
}

export async function getConnectionById(id: string): Promise<NetworkConnection | null> {
  const { data } = await db()
    .from("atlas_network_connections")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as NetworkConnection | null) ?? null;
}

export async function getConnectionBetweenProfiles(
  profileA: string,
  profileB: string,
): Promise<NetworkConnection | null> {
  const { data } = await db()
    .from("atlas_network_connections")
    .select("*")
    .or(
      `and(requester_profile_id.eq.${profileA},recipient_profile_id.eq.${profileB}),and(requester_profile_id.eq.${profileB},recipient_profile_id.eq.${profileA})`,
    )
    .maybeSingle();
  return (data as NetworkConnection | null) ?? null;
}

export async function listConnections(
  profileId: string,
  status: NetworkConnection["status"] = "accepted",
  limit = 50,
  offset = 0,
): Promise<(NetworkConnection & { profile?: NetworkProfile | null })[]> {
  const { data } = await db()
    .from("atlas_network_connections")
    .select("*")
    .eq("status", status)
    .or(`requester_profile_id.eq.${profileId},recipient_profile_id.eq.${profileId}`)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);
  const connections = (data ?? []) as NetworkConnection[];
  const otherIds = connections.map((c) =>
    c.requester_profile_id === profileId ? c.recipient_profile_id : c.requester_profile_id,
  );
  if (otherIds.length === 0) return connections.map((c) => ({ ...c, profile: null }));
  const { data: profiles } = await db()
    .from("atlas_network_profiles")
    .select("*")
    .in("id", otherIds);
  const profileMap = new Map((profiles ?? []).map((p) => [(p as NetworkProfile).id, p as NetworkProfile]));
  return connections.map((c) => ({
    ...c,
    profile:
      profileMap.get(
        c.requester_profile_id === profileId ? c.recipient_profile_id : c.requester_profile_id,
      ) ?? null,
  }));
}

export async function listPendingConnectionRequests(
  recipientProfileId: string,
  limit = 20,
): Promise<(NetworkConnection & { requester?: NetworkProfile | null })[]> {
  const { data } = await db()
    .from("atlas_network_connections")
    .select("*")
    .eq("recipient_profile_id", recipientProfileId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(limit);
  const connections = (data ?? []) as NetworkConnection[];
  const requesterIds = connections.map((c) => c.requester_profile_id);
  if (requesterIds.length === 0) return [];
  const { data: profiles } = await db()
    .from("atlas_network_profiles")
    .select("*")
    .in("id", requesterIds);
  const profileMap = new Map((profiles ?? []).map((p) => [(p as NetworkProfile).id, p as NetworkProfile]));
  return connections.map((c) => ({
    ...c,
    requester: profileMap.get(c.requester_profile_id) ?? null,
  }));
}

export async function countConnections(profileId: string): Promise<number> {
  const { count } = await db()
    .from("atlas_network_connections")
    .select("*", { count: "exact", head: true })
    .eq("status", "accepted")
    .or(`requester_profile_id.eq.${profileId},recipient_profile_id.eq.${profileId}`);
  return count ?? 0;
}

export async function getActivitiesForProfile(
  profileId: string,
  limit = 20,
  offset = 0,
): Promise<NetworkActivity[]> {
  const { data } = await db()
    .from("atlas_network_activities")
    .select("*")
    .eq("actor_profile_id", profileId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  return (data ?? []) as NetworkActivity[];
}

export async function getActivitiesForBusiness(
  businessId: string,
  limit = 20,
  offset = 0,
): Promise<NetworkActivity[]> {
  const { data } = await db()
    .from("atlas_network_activities")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  return (data ?? []) as NetworkActivity[];
}

export async function getRecentNetworkActivities(
  limit = 20,
  offset = 0,
): Promise<NetworkActivity[]> {
  const { data } = await db()
    .from("atlas_network_activities")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  return (data ?? []) as NetworkActivity[];
}

export async function getNetworkProfilesByIds(
  profileIds: string[],
): Promise<NetworkProfile[]> {
  if (profileIds.length === 0) return [];
  const { data, error } = await db()
    .from("atlas_network_profiles")
    .select("*")
    .in("id", profileIds)
    .is("deleted_at", null);
  if (error) throw new Error(error.message);
  return (data ?? []) as NetworkProfile[];
}

export async function getCompanyProfileSlugsByBusinessIds(
  businessIds: string[],
): Promise<Array<{ businessId: string; slug: string; displayName: string }>> {
  if (businessIds.length === 0) return [];
  const { data, error } = await db()
    .from("atlas_network_profiles")
    .select("business_id, slug, display_name")
    .in("business_id", businessIds)
    .eq("subject_type", "business")
    .is("deleted_at", null);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const r = row as { business_id: string; slug: string; display_name: string };
    return {
      businessId: r.business_id,
      slug: r.slug,
      displayName: r.display_name,
    };
  });
}

export async function searchNetworkProfiles(
  query: string,
  input: {
    subjectType?: NetworkProfile["subject_type"];
    limit?: number;
    offset?: number;
  } = {},
): Promise<NetworkProfile[]> {
  const limit = input.limit ?? 20;
  const offset = input.offset ?? 0;
  let q = db()
    .from("atlas_network_profiles")
    .select("*")
    .eq("privacy", "public")
    .is("deleted_at", null)
    .or(`display_name.ilike.%${query}%,headline.ilike.%${query}%,bio.ilike.%${query}%,slug.ilike.%${query}%`)
    .order("follower_count", { ascending: false })
    .range(offset, offset + limit - 1);
  if (input.subjectType) {
    q = q.eq("subject_type", input.subjectType);
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as NetworkProfile[];
}

export async function searchNetworkPosts(
  query: string,
  limit = 20,
  offset = 0,
  viewerProfileId?: string,
): Promise<NetworkFeedPost[]> {
  const { data, error } = await db()
    .from("atlas_network_posts")
    .select("*")
    .eq("visibility", "public")
    .is("deleted_at", null)
    .not("published_at", "is", null)
    .or(`title.ilike.%${query}%,body.ilike.%${query}%`)
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  const posts = (data ?? []) as NetworkPost[];
  if (posts.length === 0) return [];
  const postIds = posts.map((p) => p.id);
  const [{ data: mediaRows }, viewerReactions] = await Promise.all([
    db().from("atlas_network_post_media").select("*").in("post_id", postIds),
    viewerProfileId
      ? db()
          .from("atlas_network_reactions")
          .select("*")
          .eq("target_type", "post")
          .eq("profile_id", viewerProfileId)
          .in("target_id", postIds)
      : Promise.resolve({ data: [] }),
  ]);
  const reactions = (viewerReactions.data ?? []) as NetworkReaction[];
  return posts.map((post) => ({
    ...post,
    media: ((mediaRows ?? []) as NetworkPostMedia[]).filter((m) => m.post_id === post.id),
    user_reacted: reactions.some((r) => r.target_id === post.id),
  }));
}

export async function getSuggestedProfiles(
  excludeProfileId?: string,
  limit = 5,
): Promise<NetworkProfile[]> {
  let q = db()
    .from("atlas_network_profiles")
    .select("*")
    .eq("privacy", "public")
    .eq("subject_type", "user")
    .is("deleted_at", null)
    .order("follower_count", { ascending: false })
    .limit(limit);
  if (excludeProfileId) {
    q = q.neq("id", excludeProfileId);
  }
  const { data } = await q;
  return (data ?? []) as NetworkProfile[];
}

export async function getSuggestedCompanies(limit = 5): Promise<NetworkProfile[]> {
  const { data } = await db()
    .from("atlas_network_profiles")
    .select("*")
    .eq("privacy", "public")
    .eq("subject_type", "business")
    .is("deleted_at", null)
    .order("follower_count", { ascending: false })
    .limit(limit);
  return (data ?? []) as NetworkProfile[];
}

export async function getMutualConnections(
  profileA: string,
  profileB: string,
  limit = 10,
): Promise<NetworkProfile[]> {
  const [aConnections, bConnections] = await Promise.all([
    listConnections(profileA, "accepted", 200),
    listConnections(profileB, "accepted", 200),
  ]);
  const aIds = new Set(
    aConnections.map((c) =>
      c.requester_profile_id === profileA ? c.recipient_profile_id : c.requester_profile_id,
    ),
  );
  const mutualIds = bConnections
    .map((c) =>
      c.requester_profile_id === profileB ? c.recipient_profile_id : c.requester_profile_id,
    )
    .filter((id) => aIds.has(id))
    .slice(0, limit);
  if (mutualIds.length === 0) return [];
  const { data } = await db()
    .from("atlas_network_profiles")
    .select("*")
    .in("id", mutualIds);
  return (data ?? []) as NetworkProfile[];
}

export async function getProfileView(
  profile: NetworkProfile,
  viewerProfileId?: string,
  viewerUserId?: string,
): Promise<import("./types").NetworkProfileView> {
  const [person, company, connectionCount, connection] = await Promise.all([
    profile.subject_type === "user"
      ? getPersonProfileByNetworkProfileId(profile.id)
      : Promise.resolve(null),
    profile.business_id
      ? getCompanyProfileByBusinessId(profile.business_id)
      : Promise.resolve(null),
    countConnections(profile.id),
    viewerProfileId && viewerProfileId !== profile.id
      ? getConnectionBetweenProfiles(viewerProfileId, profile.id)
      : Promise.resolve(null),
  ]);

  let isFollowingViewer = false;
  if (viewerProfileId && viewerProfileId !== profile.id) {
    isFollowingViewer = await isFollowing({
      followerProfileId: viewerProfileId,
      targetType: "profile",
      targetId: profile.id,
    });
  }

  return {
    ...profile,
    person,
    company,
    connection_count: connectionCount,
    is_following: isFollowingViewer,
    connection_status: connection?.status ?? null,
    pending_connection_id:
      connection?.status === "pending" ? connection.id : null,
    is_incoming_pending:
      connection?.status === "pending" &&
      !!viewerProfileId &&
      connection.recipient_profile_id === viewerProfileId,
    is_owner: viewerUserId ? profile.owner_user_id === viewerUserId : false,
  };
}

export async function getEventsByNetworkProfileId(input: {
  networkProfileId: string;
  upcoming?: boolean;
  limit?: number;
}): Promise<NetworkEvent[]> {
  const now = new Date().toISOString();
  let q = db()
    .from("atlas_network_events")
    .select("*")
    .eq("network_profile_id", input.networkProfileId)
    .order("starts_at", { ascending: input.upcoming !== false })
    .limit(input.limit ?? 20);
  if (input.upcoming !== false) {
    q = q.gte("starts_at", now);
  } else {
    q = q.lt("starts_at", now);
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as NetworkEvent[];
}

export async function getCompanyAnalyticsSummary(input: {
  businessId: string;
  networkProfileId: string;
  followerCount: number;
  employeeCount: number;
}): Promise<CompanyAnalyticsSummary> {
  const {
    countBusinessProducts,
    countBusinessOrders,
    countBusinessAnalyticsViews,
  } = await import("@/modules/business-hub/repository");

  const [{ count: postsCount }, { count: servicesCount }, { data: postStats }] =
    await Promise.all([
      db()
        .from("atlas_network_posts")
        .select("*", { count: "exact", head: true })
        .eq("business_id", input.businessId)
        .is("deleted_at", null),
      db()
        .from("atlas_marketplace_listings")
        .select("*", { count: "exact", head: true })
        .eq("business_id", input.businessId)
        .eq("status", "published")
        .eq("selling_type", "service"),
      db()
        .from("atlas_network_posts")
        .select("comment_count, share_count, reaction_counts")
        .eq("business_id", input.businessId)
        .is("deleted_at", null),
    ]);

  const engagement = ((postStats ?? []) as Array<{
    comment_count: number;
    share_count: number;
    reaction_counts: Record<string, number>;
  }>).reduce((sum, p) => {
    const reactions = p.reaction_counts ?? {};
    const reactionTotal = Object.values(reactions).reduce((a, b) => a + b, 0);
    return sum + (p.comment_count ?? 0) + (p.share_count ?? 0) + reactionTotal;
  }, 0);

  const [products, orders, views] = await Promise.all([
    countBusinessProducts(input.businessId),
    countBusinessOrders(input.businessId),
    countBusinessAnalyticsViews(input.businessId),
  ]);

  return {
    followers: input.followerCount,
    employees: input.employeeCount,
    products,
    services: servicesCount ?? 0,
    orders,
    posts: postsCount ?? 0,
    engagement,
    views,
  };
}

export async function getPastEvents(input: {
  limit?: number;
}): Promise<(NetworkEvent & { profile?: NetworkProfile | null })[]> {
  const now = new Date().toISOString();
  const { data, error } = await db()
    .from("atlas_network_events")
    .select(`
      *,
      profile:atlas_network_profiles!atlas_network_events_network_profile_id_fkey (
        id, display_name, avatar_url, slug, verified
      )
    `)
    .lt("starts_at", now)
    .order("starts_at", { ascending: false })
    .limit(input.limit ?? 50);
  if (error) throw new Error(error.message);
  return (data ?? []) as (NetworkEvent & { profile?: NetworkProfile | null })[];
}

export async function searchNetworkEvents(input: {
  query: string;
  limit?: number;
  onlineOnly?: boolean;
  physicalOnly?: boolean;
  upcomingOnly?: boolean;
}): Promise<(NetworkEvent & { profile?: NetworkProfile | null })[]> {
  const q = input.query.trim();
  if (!q) return [];
  const now = new Date().toISOString();
  let query = db()
    .from("atlas_network_events")
    .select(`
      *,
      profile:atlas_network_profiles!atlas_network_events_network_profile_id_fkey (
        id, display_name, avatar_url, slug, verified
      )
    `)
    .or(`title.ilike.%${q}%,description.ilike.%${q}%,location.ilike.%${q}%`)
    .order("starts_at", { ascending: true })
    .limit(input.limit ?? 20);

  if (input.upcomingOnly !== false) {
    query = query.gte("starts_at", now);
  }
  if (input.onlineOnly) query = query.eq("is_online", true);
  if (input.physicalOnly) query = query.eq("is_online", false);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as (NetworkEvent & { profile?: NetworkProfile | null })[];
}

export async function searchNetworkJobs(input: {
  query: string;
  limit?: number;
  offset?: number;
  employmentType?: string;
  category?: string;
  openOnly?: boolean;
}): Promise<NetworkFeedPost[]> {
  const posts = await getNetworkPosts({
    postType: "job",
    limit: input.limit ?? 40,
    offset: input.offset ?? 0,
  });
  const q = input.query.trim().toLowerCase();
  return posts.filter((post) => {
    const meta = (post.metadata ?? {}) as Record<string, unknown>;
    if (input.openOnly !== false && meta.hiring_status === "closed") return false;
    if (input.employmentType && meta.employment_type !== input.employmentType) return false;
    if (input.category && meta.category !== input.category) return false;
    if (!q) return true;
    const haystack = [
      post.title,
      post.body,
      meta.location,
      meta.salary_range,
      meta.category,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export async function getJobPostsFiltered(input: {
  filter?: "featured" | "latest" | "recommended" | "open";
  limit?: number;
  businessId?: string;
}): Promise<NetworkFeedPost[]> {
  const posts = await getNetworkPosts({
    postType: "job",
    businessId: input.businessId,
    limit: input.limit ?? 50,
  });
  const open = posts.filter(
    (p) => ((p.metadata ?? {}) as Record<string, unknown>).hiring_status !== "closed",
  );

  if (input.filter === "featured") {
    return open.filter((p) => Boolean((p.metadata as Record<string, unknown>)?.is_featured));
  }

  if (input.filter === "recommended") {
    return [...open].sort((a, b) => {
      const aMeta = (a.metadata ?? {}) as Record<string, unknown>;
      const bMeta = (b.metadata ?? {}) as Record<string, unknown>;
      const aScore =
        (aMeta.is_featured ? 100 : 0) +
        (((aMeta.applications as unknown[])?.length ?? 0) as number) * 2;
      const bScore =
        (bMeta.is_featured ? 100 : 0) +
        (((bMeta.applications as unknown[])?.length ?? 0) as number) * 2;
      if (bScore !== aScore) return bScore - aScore;
      return new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime();
    });
  }

  return open;
}

export async function countOpenJobsForBusiness(businessId: string): Promise<number> {
  const { data, error } = await db()
    .from("atlas_network_posts")
    .select("metadata")
    .eq("business_id", businessId)
    .eq("post_type", "job")
    .is("deleted_at", null);
  if (error) return 0;
  return ((data ?? []) as Array<{ metadata: Record<string, unknown> }>).filter(
    (row) => row.metadata?.hiring_status !== "closed",
  ).length;
}

export async function hasUserAppliedToJob(
  postId: string,
  profileId: string,
): Promise<boolean> {
  const { data } = await db()
    .from("atlas_network_posts")
    .select("metadata")
    .eq("id", postId)
    .maybeSingle();
  if (!data) return false;
  const apps =
    ((data as { metadata: Record<string, unknown> }).metadata?.applications as Array<{
      profile_id: string;
    }>) ?? [];
  return apps.some((a) => a.profile_id === profileId);
}

export async function hasUserRegisteredForEvent(
  eventId: string,
  profileId: string,
): Promise<boolean> {
  const event = await getEventById(eventId);
  if (!event) return false;
  const registrations =
    (event.metadata.registrations as Array<{ profile_id: string }>) ?? [];
  return registrations.some((r) => r.profile_id === profileId);
}

export async function getUserJobApplications(userId: string): Promise<
  Array<{
    post: NetworkFeedPost;
    application: {
      message: string;
      applied_at: string;
      status?: string;
    };
  }>
> {
  const { data, error } = await db()
    .from("atlas_network_posts")
    .select(`
      *,
      business:businesses!atlas_network_posts_business_id_fkey (
        id, display_name, logo_url, slug
      )
    `)
    .eq("post_type", "job")
    .is("deleted_at", null);
  if (error) return [];

  const results: Array<{
    post: NetworkFeedPost;
    application: { message: string; applied_at: string; status?: string };
  }> = [];

  for (const row of (data ?? []) as NetworkFeedPost[]) {
    const apps =
      ((row.metadata ?? {}) as Record<string, unknown>).applications as Array<{
        user_id: string;
        profile_id: string;
        message: string;
        applied_at: string;
        status?: string;
      }> | undefined;
    const mine = apps?.find((a) => a.user_id === userId);
    if (mine) {
      results.push({
        post: row,
        application: {
          message: mine.message,
          applied_at: mine.applied_at,
          status: mine.status ?? "pending",
        },
      });
    }
  }

  return results.sort(
    (a, b) =>
      new Date(b.application.applied_at).getTime() -
      new Date(a.application.applied_at).getTime(),
  );
}

export async function updateJobApplicationStatusRecord(input: {
  postId: string;
  applicantProfileId: string;
  status: string;
}): Promise<void> {
  const { data: post, error: fetchError } = await db()
    .from("atlas_network_posts")
    .select("metadata, post_type")
    .eq("id", input.postId)
    .single();
  if (fetchError || !post) throw new Error("Job not found");

  const metadata = { ...((post as { metadata: Record<string, unknown> }).metadata ?? {}) };
  const applications = (metadata.applications as Array<Record<string, unknown>>) ?? [];
  const idx = applications.findIndex((a) => a.profile_id === input.applicantProfileId);
  if (idx < 0) throw new Error("Application not found");

  applications[idx] = {
    ...applications[idx],
    status: input.status,
    updated_at: new Date().toISOString(),
  };

  const { error } = await db()
    .from("atlas_network_posts")
    .update({ metadata: { ...metadata, applications } })
    .eq("id", input.postId);
  if (error) throw new Error(error.message);
}

export async function setEventReminderRecord(input: {
  eventId: string;
  profileId: string;
  userId: string;
}): Promise<void> {
  const event = await getEventById(input.eventId);
  if (!event) throw new Error("Event not found");

  const reminders =
    (event.metadata.reminders as Array<{
      profile_id: string;
      user_id: string;
      set_at: string;
    }>) ?? [];

  if (reminders.some((r) => r.profile_id === input.profileId)) return;

  reminders.push({
    profile_id: input.profileId,
    user_id: input.userId,
    set_at: new Date().toISOString(),
  });

  const { error } = await db()
    .from("atlas_network_events")
    .update({ metadata: { ...event.metadata, reminders } })
    .eq("id", input.eventId);
  if (error) throw new Error(error.message);
}

export async function businessIsHiring(businessId: string): Promise<boolean> {
  const count = await countOpenJobsForBusiness(businessId);
  return count > 0;
}
