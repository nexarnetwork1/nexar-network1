"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { publishDomainEvent } from "@/domains";
import { fanOutNotificationFromEvent } from "@/modules/atlas-core/service";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  applyToJobRecord,
  createCommentRecord,
  createEventRecord,
  createPollRecord,
  createPostMediaRecords,
  getPersonProfileByUserId,
  getNetworkPosts,
  getNetworkPostById,
  getNetworkProfileBySlug,
  getNetworkProfileById,
  getProfileView,
  getConnectionById,
  getActivitiesForProfile,
  getActivitiesForBusiness,
  getRecentNetworkActivities,
  getNetworkProfilesByIds,
  getCompanyProfileSlugsByBusinessIds,
  listConnections,
  listPendingConnectionRequests,
  listFollowers,
  listFollowing,
  getMutualConnections,
  registerForEventRecord,
  searchNetworkPosts,
  searchNetworkProfiles,
  searchNetworkJobs,
  searchNetworkEvents,
  getEventsByNetworkProfileId,
  getPastEvents,
  getJobPostsFiltered,
  getUserJobApplications,
  updateJobApplicationStatusRecord,
  setEventReminderRecord,
  getEventById,
  toggleReactionRecord,
  votePollRecord,
} from "./repository";
import {
  ensurePersonNetworkProfile,
  createNetworkPost,
  recordBusinessActivity,
  followTarget,
  unfollowTarget,
  requestConnection,
  acceptConnection,
  declineConnection,
  removeConnection,
  updatePersonNetworkProfile,
} from "./service";
import {
  applyToJobSchema,
  connectionIdSchema,
  connectionRequestSchema,
  createCommentSchema,
  createEventSchema,
  createJobPostSchema,
  createPollPostSchema,
  createPostSchema,
  followTargetSchema,
  registerForEventSchema,
  searchNetworkSchema,
  searchJobsSchema,
  searchEventsSchema,
  setEventReminderSchema,
  updateJobApplicationStatusSchema,
  toggleReactionSchema,
  updatePersonProfileSchema,
  votePollSchema,
  type CreateEventInput,
  type CreateJobPostInput,
  type CreatePollPostInput,
  type CreatePostInput,
} from "./validators";

const ATLAS_PATHS = [
  "/atlas",
  "/atlas/network",
  "/atlas/jobs",
  "/atlas/events",
  "/atlas/profile",
  "/atlas/search",
];

function revalidateAtlas() {
  for (const path of ATLAS_PATHS) {
    revalidatePath(path);
  }
}

async function buildActivityLookups(
  activities: import("./types").NetworkActivity[],
) {
  const { presentNetworkActivities } = await import("@/lib/atlas/activity-presenter");

  const profileIds = new Set<string>();
  const businessIds = new Set<string>();
  for (const activity of activities) {
    if (activity.actor_profile_id) profileIds.add(activity.actor_profile_id);
    if (activity.target_type === "profile" && activity.target_id) {
      profileIds.add(activity.target_id);
    }
    if (activity.business_id) businessIds.add(activity.business_id);
  }

  const [profiles, businesses] = await Promise.all([
    getNetworkProfilesByIds([...profileIds]),
    getCompanyProfileSlugsByBusinessIds([...businessIds]),
  ]);

  const profileMap = new Map(
    profiles.map((p) => [p.id, { slug: p.slug, displayName: p.display_name }]),
  );
  const businessMap = new Map(
    businesses.map((b) => [b.businessId, { slug: b.slug, displayName: b.displayName }]),
  );

  return presentNetworkActivities(activities, {
    profiles: profileMap,
    businesses: businessMap,
  });
}

async function emitAndNotify(input: {
  name: import("@/domains/events/catalog").DomainEventName;
  actorId: string | null;
  businessId: string | null;
  userId?: string;
  payload: Record<string, unknown>;
}) {
  const event = {
    id: randomUUID(),
    name: input.name,
    occurredAt: new Date(),
    actorId: input.actorId,
    businessId: input.businessId,
    payload: {
      ...input.payload,
      userId: input.userId ?? input.payload.userId,
    },
    correlationId: randomUUID(),
  };
  await publishDomainEvent(event);
  await fanOutNotificationFromEvent(event).catch(() => undefined);
}

function revalidateProfile(slug?: string) {
  revalidatePath("/atlas/profile");
  revalidatePath("/atlas/profile/edit");
  if (slug) revalidatePath(`/atlas/network/${slug}`);
}

async function requireNetworkProfile() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Sign in required");

  let person = await getPersonProfileByUserId(userId);
  if (!person) {
    const displayName =
      session.user?.name ??
      session.user?.email?.split("@")[0] ??
      "ATLAS Member";
    await ensurePersonNetworkProfile(userId, {
      displayName,
      profileKind: "employee",
    });
    person = await getPersonProfileByUserId(userId);
  }

  if (!person) throw new Error("Network profile not found");
  return { userId, profileId: person.network_profile_id };
}

export async function createAtlasPostAction(
  input: CreatePostInput & {
    media?: Array<{ url: string; mediaType: "image" | "video" | "document"; thumbnailUrl?: string }>;
    asAnnouncement?: boolean;
  },
) {
  const parsed = createPostSchema.parse(input);
  const { userId, profileId } = await requireNetworkProfile();

  const postType = input.asAnnouncement ? "announcement" : parsed.postType;
  const postId = await createNetworkPost(profileId, userId, {
    ...parsed,
    postType,
  });

  if (input.media?.length) {
    await createPostMediaRecords(postId, input.media);
  }

  revalidateAtlas();
  return { success: true, postId };
}

export async function createAtlasPollPostAction(input: CreatePollPostInput) {
  const parsed = createPollPostSchema.parse(input);
  const { userId, profileId } = await requireNetworkProfile();

  const postId = await createNetworkPost(profileId, userId, {
    postType: "poll",
    title: parsed.title,
    body: parsed.body,
    visibility: parsed.visibility,
    businessId: parsed.businessId,
  });

  await createPollRecord({
    postId,
    options: parsed.options,
    endsAt: parsed.endsAt ?? null,
    allowMultiple: parsed.allowMultiple,
  });

  revalidateAtlas();
  return { success: true, postId };
}

export async function createAtlasJobPostAction(input: CreateJobPostInput) {
  const parsed = createJobPostSchema.parse(input);
  const { userId, profileId } = await requireNetworkProfile();

  const postId = await createNetworkPost(profileId, userId, {
    postType: "job",
    title: parsed.jobTitle,
    body: parsed.body,
    visibility: parsed.visibility ?? "public",
    businessId: parsed.businessId,
    metadata: {
      location: parsed.location ?? null,
      employment_type: parsed.employmentType ?? null,
      salary_range: parsed.salaryRange ?? null,
      category: parsed.category ?? null,
      hiring_status: "open",
      is_featured: parsed.isFeatured ?? false,
    },
  });

  if (parsed.businessId) {
    await recordBusinessActivity({
      activityType: "job_posted",
      businessId: parsed.businessId,
      actorUserId: userId,
      payload: { postId, title: parsed.jobTitle },
    });
  }

  await emitAndNotify({
    name: "network.job_posted",
    actorId: userId,
    businessId: parsed.businessId ?? null,
    payload: {
      postId,
      title: parsed.jobTitle,
      body: `New role: ${parsed.jobTitle}`,
    },
  });

  revalidatePath("/atlas/jobs");
  revalidateAtlas();
  return { success: true, postId };
}

export async function createAtlasEventAction(input: CreateEventInput) {
  const parsed = createEventSchema.parse(input);
  const { userId, profileId } = await requireNetworkProfile();

  const postId = await createNetworkPost(profileId, userId, {
    postType: "event",
    title: parsed.title,
    body: parsed.description,
    businessId: parsed.businessId,
  });

  const event = await createEventRecord({
    networkProfileId: profileId,
    postId,
    title: parsed.title,
    description: parsed.description ?? null,
    startsAt: parsed.startsAt,
    endsAt: parsed.endsAt ?? null,
    location: parsed.location ?? null,
    isOnline: parsed.isOnline ?? false,
    metadata: parsed.meetingUrl ? { meeting_url: parsed.meetingUrl } : {},
  });

  if (parsed.businessId) {
    await recordBusinessActivity({
      activityType: "event_created",
      businessId: parsed.businessId,
      actorUserId: userId,
      payload: { eventId: event.id, postId },
    });
  }

  revalidatePath("/atlas/events");
  revalidateAtlas();
  return { success: true, eventId: event.id, postId };
}

export async function addPostCommentAction(input: {
  postId: string;
  body: string;
  parentId?: string;
}) {
  const parsed = createCommentSchema.parse(input);
  const { profileId } = await requireNetworkProfile();

  await createCommentRecord({
    postId: parsed.postId,
    authorProfileId: profileId,
    body: parsed.body,
    parentId: parsed.parentId,
  });

  const post = await getNetworkPostById(parsed.postId);
  const authorProfile = post?.author_profile_id
    ? await getNetworkProfileById(post.author_profile_id)
    : null;

  if (authorProfile?.owner_user_id) {
    await emitAndNotify({
      name: "network.comment_created",
      actorId: (await auth())?.user?.id ?? null,
      businessId: post?.business_id ?? null,
      userId: authorProfile.owner_user_id,
      payload: {
        postId: parsed.postId,
        body: "Someone commented on your post.",
        parentId: parsed.parentId ?? null,
      },
    });
  }

  revalidateAtlas();
  return { success: true };
}

export async function togglePostReactionAction(input: {
  targetType: "post" | "comment";
  targetId: string;
  reactionType?: "like" | "celebrate" | "insightful" | "support" | "interesting" | "love";
}) {
  const parsed = toggleReactionSchema.parse(input);
  const { profileId } = await requireNetworkProfile();

  const result = await toggleReactionRecord({
    targetType: parsed.targetType,
    targetId: parsed.targetId,
    profileId,
    reactionType: parsed.reactionType,
  });

  if (result.reacted && parsed.targetType === "post") {
    const post = await getNetworkPostById(parsed.targetId);
    const authorProfile = post?.author_profile_id
      ? await getNetworkProfileById(post.author_profile_id)
      : null;
    const session = await auth();

    if (authorProfile?.owner_user_id && authorProfile.owner_user_id !== session?.user?.id) {
      await emitAndNotify({
        name: "network.reaction_created",
        actorId: session?.user?.id ?? null,
        businessId: post?.business_id ?? null,
        userId: authorProfile.owner_user_id,
        payload: {
          postId: parsed.targetId,
          reactionType: parsed.reactionType ?? "like",
          body: "Someone reacted to your post.",
        },
      });
    }
  }

  revalidateAtlas();
  return { success: true, ...result };
}

export async function votePollAction(input: { pollId: string; optionId: string }) {
  const parsed = votePollSchema.parse(input);
  const { profileId } = await requireNetworkProfile();

  await votePollRecord({
    pollId: parsed.pollId,
    optionId: parsed.optionId,
    voterProfileId: profileId,
  });

  revalidateAtlas();
  return { success: true };
}

export async function applyToJobAction(input: { postId: string; message: string }) {
  const parsed = applyToJobSchema.parse(input);
  const { userId, profileId } = await requireNetworkProfile();

  await applyToJobRecord({
    postId: parsed.postId,
    profileId,
    userId,
    message: parsed.message,
  });

  const job = await getNetworkPostById(parsed.postId);
  const authorProfile = job?.author_profile_id
    ? await getNetworkProfileById(job.author_profile_id)
    : null;

  await emitAndNotify({
    name: "network.job_applied",
    actorId: userId,
    businessId: job?.business_id ?? null,
    userId: authorProfile?.owner_user_id,
    payload: {
      postId: parsed.postId,
      title: job?.title ?? "Job application",
      body: "A candidate applied to your job posting.",
      applicantProfileId: profileId,
    },
  });

  revalidatePath("/atlas/jobs");
  revalidatePath(`/atlas/jobs/${parsed.postId}`);
  revalidatePath("/atlas/jobs/applications");
  return { success: true };
}

export async function updateJobApplicationStatusAction(input: {
  postId: string;
  applicantProfileId: string;
  status: "pending" | "reviewed" | "interview_invited" | "accepted" | "rejected";
}) {
  const parsed = updateJobApplicationStatusSchema.parse(input);
  const { userId } = await requireNetworkProfile();

  await updateJobApplicationStatusRecord({
    postId: parsed.postId,
    applicantProfileId: parsed.applicantProfileId,
    status: parsed.status,
  });

  const job = await getNetworkPostById(parsed.postId);
  const applicant = await getNetworkProfileById(parsed.applicantProfileId);
  const eventName =
    parsed.status === "interview_invited"
      ? "network.interview_invited"
      : "network.job_application_updated";

  await emitAndNotify({
    name: eventName,
    actorId: userId,
    businessId: job?.business_id ?? null,
    userId: applicant?.owner_user_id,
    payload: {
      postId: parsed.postId,
      title: job?.title ?? "Application update",
      body:
        parsed.status === "interview_invited"
          ? "You have been invited to interview."
          : `Your application status is now: ${parsed.status.replace("_", " ")}.`,
      status: parsed.status,
    },
  });

  revalidatePath("/atlas/jobs/applications");
  revalidatePath(`/atlas/jobs/${parsed.postId}`);
  return { success: true };
}

export async function registerForEventAction(input: { eventId: string }) {
  const parsed = registerForEventSchema.parse(input);
  const { userId, profileId } = await requireNetworkProfile();

  await registerForEventRecord({
    eventId: parsed.eventId,
    profileId,
    userId,
  });

  const event = await getEventById(parsed.eventId);

  await emitAndNotify({
    name: "network.event_registered",
    actorId: userId,
    businessId: null,
    userId,
    payload: {
      eventId: parsed.eventId,
      title: event?.title ?? "Event registration",
      body: "You are registered for this event.",
    },
  });

  revalidatePath("/atlas/events");
  revalidatePath(`/atlas/events/${parsed.eventId}`);
  return { success: true };
}

export async function setEventReminderAction(input: { eventId: string }) {
  const parsed = setEventReminderSchema.parse(input);
  const { userId, profileId } = await requireNetworkProfile();

  await setEventReminderRecord({
    eventId: parsed.eventId,
    profileId,
    userId,
  });

  const event = await getEventById(parsed.eventId);

  await emitAndNotify({
    name: "network.event_reminder",
    actorId: userId,
    businessId: null,
    userId,
    payload: {
      eventId: parsed.eventId,
      title: event?.title ?? "Event reminder",
      body: "Reminder set — we will notify you before this event starts.",
    },
  });

  revalidatePath(`/atlas/events/${parsed.eventId}`);
  return { success: true };
}

export async function uploadNetworkMediaAction(formData: FormData) {
  const { userId } = await requireNetworkProfile();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("No file provided");
  if (file.size > 10 * 1024 * 1024) throw new Error("File too large (max 10MB)");

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `network/${userId}/${Date.now()}.${ext}`;
  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage
    .from("product-images")
    .upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (error) throw new Error(error.message);

  const { data } = admin.storage.from("product-images").getPublicUrl(path);
  let mediaType: "image" | "video" | "document" = "document";
  if (file.type.startsWith("image/")) mediaType = "image";
  else if (file.type.startsWith("video/")) mediaType = "video";

  return { url: data.publicUrl, mediaType };
}

/** Paginated feed read — reuses repository; no mutation of existing create/update logic. */
export async function fetchNetworkFeedAction(input: {
  offset: number;
  limit?: number;
}) {
  const session = await auth();
  let viewerProfileId: string | undefined;
  if (session?.user?.id) {
    const person = await getPersonProfileByUserId(session.user.id);
    viewerProfileId = person?.network_profile_id;
  }

  const limit = input.limit ?? 20;
  const posts = await getNetworkPosts({
    limit,
    offset: input.offset,
    includeComments: true,
    viewerProfileId,
  });

  return { posts, hasMore: posts.length === limit };
}

export async function getNetworkProfileViewAction(slug: string) {
  const session = await auth();
  const profile = await getNetworkProfileBySlug(slug);
  if (!profile) return null;

  let viewerProfileId: string | undefined;
  if (session?.user?.id) {
    const person = await getPersonProfileByUserId(session.user.id);
    viewerProfileId = person?.network_profile_id;
  }

  return getProfileView(profile, viewerProfileId, session?.user?.id);
}

export async function updateNetworkProfileAction(
  input: import("./validators").UpdatePersonProfileInput,
) {
  const parsed = updatePersonProfileSchema.parse(input);
  const { userId, profileId } = await requireNetworkProfile();
  const profile = await updatePersonNetworkProfile(userId, profileId, parsed);
  revalidateProfile(profile.slug);
  return { success: true, profileId: profile.id };
}

export async function followProfileAction(input: {
  targetType: "profile" | "business" | "page" | "community" | "event";
  targetId: string;
}) {
  const parsed = followTargetSchema.parse(input);
  const { userId, profileId } = await requireNetworkProfile();
  await followTarget(profileId, userId, parsed);

  if (parsed.targetType === "profile") {
    const target = await getNetworkProfileById(parsed.targetId);
    if (target?.owner_user_id && target.owner_user_id !== userId) {
      await emitAndNotify({
        name: "network.follow_created",
        actorId: userId,
        businessId: null,
        userId: target.owner_user_id,
        payload: {
          followerProfileId: profileId,
          targetId: parsed.targetId,
          body: "Someone started following you.",
          profileSlug: target.slug,
        },
      });
    }
  }

  revalidateAtlas();
  return { success: true };
}

export async function unfollowProfileAction(input: {
  targetType: "profile" | "business" | "page" | "community" | "event";
  targetId: string;
}) {
  const parsed = followTargetSchema.parse(input);
  const { userId, profileId } = await requireNetworkProfile();
  await unfollowTarget(profileId, userId, parsed);
  revalidateAtlas();
  return { success: true };
}

export async function requestConnectionAction(
  input: import("./validators").ConnectionRequestInput,
) {
  const parsed = connectionRequestSchema.parse(input);
  const { userId, profileId } = await requireNetworkProfile();
  if (parsed.recipientProfileId === profileId) {
    throw new Error("Cannot connect with yourself");
  }
  await requestConnection(profileId, userId, parsed);

  const recipient = await getNetworkProfileById(parsed.recipientProfileId);
  if (recipient?.owner_user_id) {
    await emitAndNotify({
      name: "network.connection_requested",
      actorId: userId,
      businessId: null,
      userId: recipient.owner_user_id,
      payload: {
        requesterProfileId: profileId,
        recipientProfileId: parsed.recipientProfileId,
        body: "You received a new connection request.",
        profileSlug: recipient.slug,
      },
    });
  }

  revalidateAtlas();
  return { success: true };
}

export async function acceptConnectionAction(input: { connectionId: string }) {
  const parsed = connectionIdSchema.parse(input);
  const { userId, profileId } = await requireNetworkProfile();
  const connection = await getConnectionById(parsed.connectionId);
  if (!connection || connection.recipient_profile_id !== profileId) {
    throw new Error("Not authorized to accept this request");
  }
  await acceptConnection(parsed.connectionId, userId);

  if (connection) {
    const requester = await getNetworkProfileById(connection.requester_profile_id);
    if (requester?.owner_user_id) {
      await emitAndNotify({
        name: "network.connection_accepted",
        actorId: userId,
        businessId: null,
        userId: requester.owner_user_id,
        payload: {
          connectionId: parsed.connectionId,
          body: "Your connection request was accepted.",
          profileSlug: requester.slug,
        },
      });
    }
  }

  revalidateAtlas();
  return { success: true };
}

export async function declineConnectionAction(input: { connectionId: string }) {
  const parsed = connectionIdSchema.parse(input);
  const { userId, profileId } = await requireNetworkProfile();
  await declineConnection(parsed.connectionId, userId, profileId);
  revalidateAtlas();
  return { success: true };
}

export async function removeConnectionAction(input: { connectionId: string }) {
  const parsed = connectionIdSchema.parse(input);
  const { profileId } = await requireNetworkProfile();
  await removeConnection(parsed.connectionId, profileId);
  revalidateAtlas();
  return { success: true };
}

export async function searchNetworkAction(
  input: import("./validators").SearchNetworkInput,
) {
  const parsed = searchNetworkSchema.parse(input);
  const session = await auth();

  const type = parsed.type ?? "all";
  const limit = parsed.limit ?? 20;
  const offset = parsed.offset ?? 0;
  const query = parsed.query.trim();

  const canCache =
    !session?.user?.id &&
    type !== "messages" &&
    offset === 0 &&
    query.length >= 2;

  if (canCache) {
    const { cacheGetJson, cacheSetJson, cacheKey } = await import(
      "@/lib/cache/search-cache"
    );
    const key = cacheKey(["search", type, query, String(limit)]);
    const cached = await cacheGetJson<Awaited<ReturnType<typeof runNetworkSearch>>>(key);
    if (cached) return cached;
    const result = await runNetworkSearch(parsed, session);
    void cacheSetJson(key, result, 60);
    return result;
  }

  return runNetworkSearch(parsed, session);
}

async function runNetworkSearch(
  parsed: import("./validators").SearchNetworkInput,
  session: { user?: { id?: string } | null } | null,
) {
  let viewerProfileId: string | undefined;
  if (session?.user?.id) {
    const person = await getPersonProfileByUserId(session.user.id);
    viewerProfileId = person?.network_profile_id;
  }

  const type = parsed.type ?? "all";
  const limit = parsed.limit ?? 20;
  const offset = parsed.offset ?? 0;
  const query = parsed.query.trim();

  const skipProfiles =
    type === "posts" ||
    type === "products" ||
    type === "stores" ||
    type === "jobs" ||
    type === "events" ||
    type === "messages";

  const profiles = skipProfiles
    ? []
    : await searchNetworkProfiles(query, {
        subjectType:
          type === "people" ? "user" : type === "companies" ? "business" : undefined,
        limit,
        offset,
      });

  const posts =
    type === "people" ||
    type === "companies" ||
    type === "products" ||
    type === "stores" ||
    type === "jobs" ||
    type === "events" ||
    type === "messages"
      ? []
      : await searchNetworkPosts(query, limit, offset, viewerProfileId);

  let listings: import("@/modules/atlas-marketplace/types").EnrichedMarketplaceListing[] = [];
  let storefronts: import("@/modules/atlas-marketplace/types").MarketplaceStorefront[] = [];
  let jobs: import("./types").NetworkFeedPost[] = [];
  let events: import("./types").NetworkEvent[] = [];
  let messages: import("@/modules/atlas-connect/search").ConnectSearchHit[] = [];

  if (type === "all" || type === "products" || type === "stores") {
    const { searchListings, searchStorefronts, enrichListingsWithProducts } = await import(
      "@/modules/atlas-marketplace/repository"
    );
    if (type === "all" || type === "products") {
      const raw = await searchListings({ query, limit });
      listings = await enrichListingsWithProducts(raw);
    }
    if (type === "all" || type === "stores") {
      storefronts = await searchStorefronts({ query, limit });
    }
  }

  if (type === "all" || type === "jobs") {
    jobs = await searchNetworkJobs({ query, limit, openOnly: true });
  }

  if (type === "all" || type === "events") {
    events = await searchNetworkEvents({ query, limit, upcomingOnly: true });
  }

  if ((type === "all" || type === "messages") && session?.user?.id) {
    const { getBusinessesForUser } = await import("@/modules/business-hub/repository");
    const { getWorkspaceByBusinessId, searchConnectWorkspace } = await import(
      "@/modules/atlas-connect/repository"
    );
    const { rankSearchHits } = await import("@/modules/atlas-connect/search");
    const memberships = await getBusinessesForUser(session.user.id);
    const hits: import("@/modules/atlas-connect/search").ConnectSearchHit[] = [];
    for (const business of memberships.slice(0, 5)) {
      const workspace = await getWorkspaceByBusinessId(business.id);
      if (!workspace) continue;
      const workspaceHits = await searchConnectWorkspace({
        workspaceId: workspace.id,
        query,
        scopes: ["messages"],
        limit,
      });
      hits.push(...workspaceHits);
    }
    messages = rankSearchHits(hits).slice(0, limit);
  }

  return { profiles, posts, listings, storefronts, jobs, events, messages };
}

export async function fetchProfilePostsAction(input: {
  profileId: string;
  offset?: number;
  limit?: number;
}) {
  const posts = await getNetworkPosts({
    authorProfileId: input.profileId,
    limit: input.limit ?? 20,
    offset: input.offset ?? 0,
    includeComments: false,
  });
  return { posts, hasMore: posts.length === (input.limit ?? 20) };
}

export async function fetchProfileActivityAction(input: {
  profileId: string;
  offset?: number;
  limit?: number;
}) {
  const activities = await getActivitiesForProfile(
    input.profileId,
    input.limit ?? 20,
    input.offset ?? 0,
  );
  const items = await buildActivityLookups(activities);
  return { activities: items, hasMore: activities.length === (input.limit ?? 20) };
}

export async function fetchCompanyActivityAction(input: {
  businessId: string;
  offset?: number;
  limit?: number;
}) {
  const activities = await getActivitiesForBusiness(
    input.businessId,
    input.limit ?? 20,
    input.offset ?? 0,
  );
  const items = await buildActivityLookups(activities);
  return { activities: items, hasMore: activities.length === (input.limit ?? 20) };
}

export async function fetchGlobalActivityAction(input: {
  offset?: number;
  limit?: number;
} = {}) {
  const activities = await getRecentNetworkActivities(input.limit ?? 20, input.offset ?? 0);
  const items = await buildActivityLookups(activities);
  return { activities: items, hasMore: activities.length === (input.limit ?? 20) };
}

export async function fetchProfileConnectionsAction(input: {
  profileId: string;
  offset?: number;
  limit?: number;
}) {
  const connections = await listConnections(
    input.profileId,
    "accepted",
    input.limit ?? 50,
    input.offset ?? 0,
  );
  return { connections };
}

export async function fetchPendingConnectionsAction() {
  const { profileId } = await requireNetworkProfile();
  return listPendingConnectionRequests(profileId);
}

export async function fetchProfileFollowersAction(input: {
  profileId: string;
  offset?: number;
  limit?: number;
}) {
  const profiles = await listFollowers(input.profileId, input.limit ?? 20, input.offset ?? 0);
  return { profiles };
}

export async function fetchProfileFollowingAction(input: {
  profileId: string;
  offset?: number;
  limit?: number;
}) {
  const profiles = await listFollowing(input.profileId, input.limit ?? 20, input.offset ?? 0);
  return { profiles };
}

export async function fetchMutualConnectionsAction(input: { profileId: string }) {
  const { profileId: viewerProfileId } = await requireNetworkProfile();
  const mutual = await getMutualConnections(viewerProfileId, input.profileId);
  return { profiles: mutual };
}

export async function fetchCompanyEmployeesAction(input: { businessId: string }) {
  const { listBusinessMembers } = await import("@/modules/business-hub/repository");
  const members = await listBusinessMembers(input.businessId);
  return { members };
}

export async function fetchCompanyProductsAction(input: {
  businessId: string;
  filter?: "featured" | "latest" | "top";
  limit?: number;
}) {
  const { listPublishedListings, enrichListingsWithProducts } = await import(
    "@/modules/atlas-marketplace/repository"
  );
  const listings = await listPublishedListings({
    businessId: input.businessId,
    limit: input.limit ?? 24,
  });
  const physical = listings.filter((l) => l.selling_type !== "service");
  let filtered = physical;
  if (input.filter === "featured") {
    filtered = physical.filter((l) => l.is_featured);
  } else if (input.filter === "top") {
    filtered = [...physical].sort((a, b) => {
      const aSales = Number((a.metadata?.sales_count as number | undefined) ?? 0);
      const bSales = Number((b.metadata?.sales_count as number | undefined) ?? 0);
      return bSales - aSales;
    });
  }
  return { listings: await enrichListingsWithProducts(filtered) };
}

export async function fetchCompanyServicesAction(input: { businessId: string; limit?: number }) {
  const { listPublishedListings, enrichListingsWithProducts } = await import(
    "@/modules/atlas-marketplace/repository"
  );
  const listings = await listPublishedListings({
    businessId: input.businessId,
    limit: input.limit ?? 24,
  });
  const serviceListings = listings.filter((l) => l.selling_type === "service");
  const posts = await getNetworkPosts({
    businessId: input.businessId,
    postType: "service",
    limit: input.limit ?? 20,
  });
  return { listings: await enrichListingsWithProducts(serviceListings), posts };
}

export async function fetchCompanyEventsAction(input: {
  networkProfileId: string;
  upcoming?: boolean;
  limit?: number;
}) {
  const events = await getEventsByNetworkProfileId({
    networkProfileId: input.networkProfileId,
    upcoming: input.upcoming ?? true,
    limit: input.limit ?? 20,
  });
  return { events };
}

export async function fetchCompanyJobsAction(input: {
  businessId: string;
  limit?: number;
  filter?: "featured" | "latest" | "recommended" | "open";
}) {
  const jobs = await getJobPostsFiltered({
    businessId: input.businessId,
    filter: input.filter ?? "open",
    limit: input.limit ?? 20,
  });
  return { jobs };
}

export async function fetchJobsAction(input: import("./validators").SearchJobsInput) {
  const parsed = searchJobsSchema.parse(input);
  if (parsed.query?.trim()) {
    const jobs = await searchNetworkJobs({
      query: parsed.query,
      limit: parsed.limit ?? 30,
      employmentType: parsed.employmentType,
      category: parsed.category,
      openOnly: true,
    });
    return { jobs };
  }
  const jobs = await getJobPostsFiltered({
    filter: parsed.filter ?? "latest",
    limit: parsed.limit ?? 30,
  });
  return { jobs };
}

export async function fetchEventsAction(input: import("./validators").SearchEventsInput) {
  const parsed = searchEventsSchema.parse(input);
  if (parsed.query?.trim()) {
    const events = await searchNetworkEvents({
      query: parsed.query,
      limit: parsed.limit ?? 30,
      onlineOnly: parsed.onlineOnly,
      physicalOnly: parsed.physicalOnly,
      upcomingOnly: parsed.upcomingOnly ?? true,
    });
    return { events };
  }
  if (parsed.upcomingOnly === false) {
    const events = await getPastEvents({ limit: parsed.limit ?? 30 });
    return { events };
  }
  const { getUpcomingEvents } = await import("./repository");
  let events = await getUpcomingEvents({ limit: parsed.limit ?? 30 });
  if (parsed.onlineOnly) events = events.filter((e) => e.is_online);
  if (parsed.physicalOnly) events = events.filter((e) => !e.is_online);
  return { events };
}

export async function fetchMyApplicationsAction() {
  const { userId } = await requireNetworkProfile();
  const applications = await getUserJobApplications(userId);
  return { applications };
}

export async function fetchCompanyStorefrontAction(input: { businessId: string }) {
  const { getStorefrontByBusinessId } = await import("@/modules/atlas-marketplace/repository");
  const storefront = await getStorefrontByBusinessId(input.businessId);
  return { storefront };
}

export async function fetchProfileProductsAction(input: {
  profileId: string;
  limit?: number;
}) {
  const profile = await getNetworkProfileById(input.profileId);
  if (!profile) return { listings: [] };

  const { getBusinessesForUser } = await import("@/modules/business-hub/repository");
  const { listPublishedListings, enrichListingsWithProducts } = await import(
    "@/modules/atlas-marketplace/repository"
  );

  const businesses = await getBusinessesForUser(profile.owner_user_id);
  const ownerBusinessIds = businesses
    .filter((b) => ["owner", "admin"].includes(b.membership.role))
    .map((b) => b.id);

  if (ownerBusinessIds.length === 0) return { listings: [] };

  const perBusiness = Math.max(4, Math.ceil((input.limit ?? 12) / ownerBusinessIds.length));
  const batches = await Promise.all(
    ownerBusinessIds.map((businessId) =>
      listPublishedListings({ businessId, limit: perBusiness }),
    ),
  );
  const merged = batches.flat().slice(0, input.limit ?? 12);
  return { listings: await enrichListingsWithProducts(merged) };
}
