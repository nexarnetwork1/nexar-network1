import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  NetworkActivity,
  NetworkComment,
  NetworkCompanyProfile,
  NetworkConnection,
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
        name,
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
        id, name, logo_url, slug
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
  }>) ?? [];

  if (applications.some((a) => a.profile_id === input.profileId)) {
    throw new Error("Already applied");
  }

  applications.push({
    profile_id: input.profileId,
    user_id: input.userId,
    message: input.message,
    applied_at: new Date().toISOString(),
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
