"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  applyToJobRecord,
  createCommentRecord,
  createEventRecord,
  createPollRecord,
  createPostMediaRecords,
  createPostRecord,
  getPersonProfileByUserId,
  registerForEventRecord,
  toggleReactionRecord,
  votePollRecord,
} from "./repository";
import {
  ensurePersonNetworkProfile,
  createNetworkPost,
  recordBusinessActivity,
} from "./service";
import {
  applyToJobSchema,
  createCommentSchema,
  createEventSchema,
  createJobPostSchema,
  createPollPostSchema,
  createPostSchema,
  registerForEventSchema,
  toggleReactionSchema,
  votePollSchema,
  type CreateEventInput,
  type CreateJobPostInput,
  type CreatePollPostInput,
  type CreatePostInput,
} from "./validators";

const ATLAS_PATHS = ["/atlas", "/atlas/network", "/atlas/jobs", "/atlas/events"];

function revalidateAtlas() {
  for (const path of ATLAS_PATHS) {
    revalidatePath(path);
  }
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

  const post = await createPostRecord({
    authorProfileId: profileId,
    businessId: parsed.businessId,
    postType: "job",
    title: parsed.jobTitle,
    body: parsed.body,
    visibility: parsed.visibility ?? "public",
    metadata: {
      location: parsed.location ?? null,
      employment_type: parsed.employmentType ?? null,
      salary_range: parsed.salaryRange ?? null,
    },
    publish: true,
  });

  if (parsed.businessId) {
    await recordBusinessActivity({
      activityType: "job_posted",
      businessId: parsed.businessId,
      actorUserId: userId,
      payload: { postId: post.id, title: parsed.jobTitle },
    });
  }

  revalidatePath("/atlas/jobs");
  revalidateAtlas();
  return { success: true, postId: post.id };
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

  revalidatePath("/atlas/jobs");
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

  revalidatePath("/atlas/events");
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
