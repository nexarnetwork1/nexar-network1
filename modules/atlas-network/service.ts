import "server-only";

import { randomUUID } from "node:crypto";
import { publishDomainEvent, type DomainEvent } from "@/domains";
import type { AtlasNetworkPort, NetworkProfileRecord } from "@/domains/contracts/ports";
import {
  createActivityRecord,
  createCompanyProfileRecord,
  createConnectionRecord,
  createFollowRecord,
  createNetworkProfileRecord,
  createPageRecord,
  createPersonProfileRecord,
  createPostRecord,
  decrementFollowerCount,
  decrementFollowingCount,
  deleteFollowRecord,
  getCompanyProfileByBusinessId,
  getConnectionById,
  getNetworkProfileByBusinessId,
  getNetworkProfileById,
  getPersonProfileByUserId,
  incrementFollowerCount,
  incrementFollowingCount,
  resolveUniqueNetworkSlug,
  updateConnectionStatus,
  updateNetworkProfileRecord,
  updatePersonProfileRecord,
  addTimelineEntry,
} from "./repository";
import type {
  NetworkProfile,
  NetworkProfileKind,
} from "./types";
import type {
  ConnectionRequestInput,
  CreatePersonProfileInput,
  CreatePostInput,
  FollowTargetInput,
  UpdatePersonProfileInput,
} from "./validators";

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

function toRecord(profile: NetworkProfile): NetworkProfileRecord {
  return {
    id: profile.id,
    slug: profile.slug,
    displayName: profile.display_name,
    profileKind: profile.profile_kind,
    businessId: profile.business_id,
    ownerUserId: profile.owner_user_id,
    verified: profile.verified,
  };
}

/**
 * Ensure every Business owns an ATLAS Network company profile + page.
 * Idempotent — DB trigger also provisions; this is the app-layer mirror.
 */
export async function ensureCompanyNetworkProfile(input: {
  businessId: string;
  ownerUserId: string;
  displayName: string;
  legalName: string;
  slug: string;
  businessType?: string | null;
  logoUrl?: string | null;
  website?: string | null;
}): Promise<NetworkProfile> {
  const existing = await getNetworkProfileByBusinessId(input.businessId);
  if (existing) return existing;

  const networkSlug = await resolveUniqueNetworkSlug(`${input.slug}-network`);
  const profile = await createNetworkProfileRecord({
    subjectType: "business",
    subjectId: input.businessId,
    profileKind: "business",
    slug: networkSlug,
    displayName: input.displayName,
    headline: input.legalName,
    avatarUrl: input.logoUrl,
    ownerUserId: input.ownerUserId,
    businessId: input.businessId,
    profileData: { industry: input.businessType ?? null },
    metadata: { source: "ensureCompanyNetworkProfile" },
  });

  await createCompanyProfileRecord({
    businessId: input.businessId,
    networkProfileId: profile.id,
    industry: input.businessType,
    website: input.website,
  });

  await createPageRecord({
    networkProfileId: profile.id,
    businessId: input.businessId,
    pageType: "company",
  });

  await emit("network.company_profile_created", {
    actorId: input.ownerUserId,
    businessId: input.businessId,
    payload: { profileId: profile.id, slug: profile.slug },
  });

  return profile;
}

/** Create a professional person profile for a user. */
export async function ensurePersonNetworkProfile(
  userId: string,
  input: CreatePersonProfileInput,
): Promise<NetworkProfile> {
  const existing = await getPersonProfileByUserId(userId);
  if (existing) {
    const profile = await getNetworkProfileById(existing.network_profile_id);
    if (profile) return profile;
  }

  const slug = await resolveUniqueNetworkSlug(
    input.displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  );
  const profile = await createNetworkProfileRecord({
    subjectType: "user",
    subjectId: userId,
    profileKind: input.profileKind as NetworkProfileKind,
    slug,
    displayName: input.displayName,
    headline: input.headline,
    ownerUserId: userId,
    privacy: input.privacy,
    metadata: { source: "ensurePersonNetworkProfile" },
  });

  await createPersonProfileRecord({
    userId,
    networkProfileId: profile.id,
  });

  await emit("network.profile_created", {
    actorId: userId,
    businessId: null,
    payload: { profileId: profile.id, profileKind: input.profileKind },
  });

  return profile;
}

export async function followTarget(
  followerProfileId: string,
  actorUserId: string,
  input: FollowTargetInput,
): Promise<void> {
  await createFollowRecord({
    followerProfileId,
    targetType: input.targetType,
    targetId: input.targetId,
  });

  if (input.targetType === "profile") {
    await incrementFollowerCount(input.targetId);
    await incrementFollowingCount(followerProfileId);
  }

  await createActivityRecord({
    activityType: "follow",
    actorProfileId: followerProfileId,
    targetType: input.targetType,
    targetId: input.targetId,
  });

  await emit("network.follow_created", {
    actorId: actorUserId,
    businessId: null,
    payload: { followerProfileId, ...input },
  });
}

export async function unfollowTarget(
  followerProfileId: string,
  actorUserId: string,
  input: FollowTargetInput,
): Promise<void> {
  await deleteFollowRecord({
    followerProfileId,
    targetType: input.targetType,
    targetId: input.targetId,
  });

  if (input.targetType === "profile") {
    await decrementFollowerCount(input.targetId);
    await decrementFollowingCount(followerProfileId);
  }

  await emit("network.follow_removed", {
    actorId: actorUserId,
    businessId: null,
    payload: { followerProfileId, ...input },
  });
}

export async function updatePersonNetworkProfile(
  userId: string,
  networkProfileId: string,
  input: UpdatePersonProfileInput,
): Promise<NetworkProfile> {
  const existing = await getNetworkProfileById(networkProfileId);
  if (!existing || existing.owner_user_id !== userId) {
    throw new Error("Not authorized to update this profile");
  }

  const profileData = {
    ...(existing.profile_data ?? {}),
    ...(input.location !== undefined ? { location: input.location } : {}),
    ...(input.website !== undefined ? { website: input.website } : {}),
    ...(input.walletAddress !== undefined ? { walletAddress: input.walletAddress } : {}),
    ...(input.languages !== undefined ? { languages: input.languages } : {}),
    ...(input.socialLinks !== undefined ? { socialLinks: input.socialLinks } : {}),
  };

  const profile = await updateNetworkProfileRecord(networkProfileId, {
    ...(input.displayName !== undefined ? { display_name: input.displayName } : {}),
    ...(input.headline !== undefined ? { headline: input.headline } : {}),
    ...(input.bio !== undefined ? { bio: input.bio } : {}),
    ...(input.avatarUrl !== undefined ? { avatar_url: input.avatarUrl } : {}),
    ...(input.coverUrl !== undefined ? { cover_url: input.coverUrl } : {}),
    ...(input.privacy !== undefined ? { privacy: input.privacy } : {}),
    profile_data: profileData,
  });

  if (
    input.skills !== undefined ||
    input.experience !== undefined ||
    input.education !== undefined ||
    input.certificates !== undefined
  ) {
    await updatePersonProfileRecord(userId, {
      ...(input.skills !== undefined ? { skills: input.skills } : {}),
      ...(input.experience !== undefined ? { experience: input.experience } : {}),
      ...(input.education !== undefined ? { education: input.education } : {}),
      ...(input.certificates !== undefined ? { certificates: input.certificates } : {}),
    });
  }

  await emit("network.profile_updated", {
    actorId: userId,
    businessId: existing.business_id,
    payload: { profileId: networkProfileId },
  });

  return profile;
}

export async function requestConnection(
  requesterProfileId: string,
  actorUserId: string,
  input: ConnectionRequestInput,
): Promise<void> {
  await createConnectionRecord({
    requesterProfileId,
    recipientProfileId: input.recipientProfileId,
    connectionKind: input.connectionKind,
    message: input.message,
  });

  await emit("network.connection_requested", {
    actorId: actorUserId,
    businessId: null,
    payload: { requesterProfileId, ...input },
  });
}

export async function acceptConnection(
  connectionId: string,
  actorUserId: string,
): Promise<void> {
  const connection = await updateConnectionStatus(connectionId, "accepted");
  await createActivityRecord({
    activityType: "connection_accepted",
    actorProfileId: connection.requester_profile_id,
    targetType: "profile",
    targetId: connection.recipient_profile_id,
  });
  await emit("network.connection_accepted", {
    actorId: actorUserId,
    businessId: null,
    payload: { connectionId },
  });
}

export async function declineConnection(
  connectionId: string,
  actorUserId: string,
  recipientProfileId: string,
): Promise<void> {
  const connection = await getConnectionById(connectionId);
  if (!connection || connection.recipient_profile_id !== recipientProfileId) {
    throw new Error("Connection not found");
  }
  await updateConnectionStatus(connectionId, "declined");
  await emit("network.connection_declined", {
    actorId: actorUserId,
    businessId: null,
    payload: { connectionId },
  });
}

export async function removeConnection(
  connectionId: string,
  actorProfileId: string,
): Promise<void> {
  const connection = await getConnectionById(connectionId);
  if (
    !connection ||
    (connection.requester_profile_id !== actorProfileId &&
      connection.recipient_profile_id !== actorProfileId)
  ) {
    throw new Error("Connection not found");
  }
  await updateConnectionStatus(connectionId, "revoked");
}

export async function createNetworkPost(
  authorProfileId: string,
  actorUserId: string,
  input: CreatePostInput,
): Promise<string> {
  const post = await createPostRecord({
    authorProfileId,
    businessId: input.businessId,
    postType: input.postType,
    title: input.title,
    body: input.body,
    visibility: input.visibility,
    metadata: input.metadata,
    publish: true,
  });

  const activity = await createActivityRecord({
    activityType: "post_created",
    actorProfileId: authorProfileId,
    businessId: input.businessId ?? null,
    targetType: "post",
    targetId: post.id,
    payload: { postType: input.postType },
  });

  await addTimelineEntry({
    feedOwnerProfileId: authorProfileId,
    activityId: activity.id,
    postId: post.id,
    score: Date.now(),
  });

  await emit("network.post_created", {
    actorId: actorUserId,
    businessId: input.businessId ?? null,
    payload: { postId: post.id, postType: input.postType },
  });

  return post.id;
}

/** Record cross-module activity (product created, store opened, etc.). */
export async function recordBusinessActivity(input: {
  activityType:
    | "product_created"
    | "store_created"
    | "employee_hired"
    | "partner_added"
    | "event_created"
    | "job_posted"
    | "investment_made";
  businessId: string;
  actorUserId: string | null;
  payload: Record<string, unknown>;
}): Promise<void> {
  const companyProfile = await getCompanyProfileByBusinessId(input.businessId);
  const profileId = companyProfile?.network_profile_id ?? null;

  const activity = await createActivityRecord({
    activityType: input.activityType,
    actorProfileId: profileId,
    businessId: input.businessId,
    payload: input.payload,
  });

  if (profileId) {
    await addTimelineEntry({
      feedOwnerProfileId: profileId,
      activityId: activity.id,
      score: Date.now(),
    });
  }

  await emit("network.activity_recorded", {
    actorId: input.actorUserId,
    businessId: input.businessId,
    payload: { activityType: input.activityType, activityId: activity.id },
  });
}

/** Auto-publish a product announcement post when catalog publishes a product. */
export async function publishProductNetworkPost(input: {
  businessId: string;
  actorUserId: string | null;
  productId: string;
  listingId?: string | null;
  productSlug?: string | null;
  title: string;
  summary?: string | null;
  price?: number | null;
  currency?: string;
  imageUrl?: string | null;
}): Promise<string | null> {
  const companyProfile = await getCompanyProfileByBusinessId(input.businessId);
  const networkProfile = await getNetworkProfileByBusinessId(input.businessId);
  const profileId = companyProfile?.network_profile_id ?? networkProfile?.id;
  if (!profileId) return null;

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("atlas_network_posts")
    .select("id")
    .eq("business_id", input.businessId)
    .eq("post_type", "product")
    .contains("metadata", { productId: input.productId })
    .is("deleted_at", null)
    .maybeSingle();
  if (existing) return (existing as { id: string }).id;

  const actorUserId = input.actorUserId ?? networkProfile?.owner_user_id ?? "";
  if (!actorUserId) return null;

  return createNetworkPost(profileId, actorUserId, {
    postType: "product",
    businessId: input.businessId,
    title: input.title,
    body: input.summary ?? undefined,
    visibility: "public",
    metadata: {
      productId: input.productId,
      listingId: input.listingId ?? null,
      productSlug: input.productSlug ?? null,
      price: input.price ?? null,
      currency: input.currency ?? "USD",
      imageUrl: input.imageUrl ?? null,
    },
  });
}

export function createAtlasNetworkPort(): AtlasNetworkPort {
  return {
    async getProfileByBusinessId(businessId) {
      const profile = await getNetworkProfileByBusinessId(businessId);
      return profile ? toRecord(profile) : null;
    },
    async getProfileById(id) {
      const profile = await getNetworkProfileById(id);
      return profile ? toRecord(profile) : null;
    },
    async ensureCompanyProfile(business) {
      const profile = await ensureCompanyNetworkProfile(business);
      return toRecord(profile);
    },
  };
}
