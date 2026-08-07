import { z } from "zod";

export const createPersonProfileSchema = z.object({
  displayName: z.string().min(2).max(120),
  headline: z.string().max(200).optional(),
  bio: z.string().max(2000).optional(),
  profileKind: z.enum([
    "employee",
    "founder",
    "investor",
    "partner",
    "supplier",
    "customer",
    "creator",
    "developer",
  ]),
  privacy: z
    .enum(["public", "followers", "connections", "private", "organization_only"])
    .optional(),
});

export const createPostSchema = z.object({
  postType: z.enum([
    "text",
    "image",
    "video",
    "pdf",
    "carousel",
    "product",
    "service",
    "poll",
    "job",
    "event",
    "announcement",
    "article",
  ]),
  title: z.string().max(300).optional(),
  body: z.string().max(10000).optional(),
  visibility: z
    .enum(["public", "followers", "connections", "private", "organization_only"])
    .optional(),
  businessId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const followTargetSchema = z.object({
  targetType: z.enum(["profile", "business", "page", "community", "event"]),
  targetId: z.string().uuid(),
});

export const connectionRequestSchema = z.object({
  recipientProfileId: z.string().uuid(),
  connectionKind: z.enum([
    "business_business",
    "business_employee",
    "investor_startup",
    "supplier_merchant",
    "partner_partner",
    "professional",
  ]),
  message: z.string().max(500).optional(),
});

export const createCommentSchema = z.object({
  postId: z.string().uuid(),
  body: z.string().min(1).max(5000),
  parentId: z.string().uuid().optional(),
});

export const toggleReactionSchema = z.object({
  targetType: z.enum(["post", "comment"]),
  targetId: z.string().uuid(),
  reactionType: z
    .enum(["like", "celebrate", "insightful", "support", "interesting", "love"])
    .optional(),
});

export const createPollPostSchema = createPostSchema.extend({
  postType: z.literal("poll"),
  options: z.array(z.string().min(1).max(200)).min(2).max(6),
  endsAt: z.string().datetime().optional(),
  allowMultiple: z.boolean().optional(),
});

export const votePollSchema = z.object({
  pollId: z.string().uuid(),
  optionId: z.string().uuid(),
});

export const createEventSchema = z.object({
  title: z.string().min(2).max(300),
  description: z.string().max(5000).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  location: z.string().max(500).optional(),
  isOnline: z.boolean().optional(),
  businessId: z.string().uuid().optional(),
  meetingUrl: z.string().url().optional(),
});

export const createJobPostSchema = createPostSchema.extend({
  postType: z.literal("job"),
  jobTitle: z.string().min(2).max(200),
  location: z.string().max(200).optional(),
  employmentType: z
    .enum(["full_time", "part_time", "contract", "internship", "remote"])
    .optional(),
  salaryRange: z.string().max(100).optional(),
  category: z
    .enum([
      "engineering",
      "design",
      "marketing",
      "sales",
      "operations",
      "finance",
      "hr",
      "other",
    ])
    .optional(),
  isFeatured: z.boolean().optional(),
});

export const applyToJobSchema = z.object({
  postId: z.string().uuid(),
  message: z.string().min(10).max(2000),
});

export const registerForEventSchema = z.object({
  eventId: z.string().uuid(),
});

export const postMediaSchema = z.object({
  url: z.string().url(),
  mediaType: z.enum(["image", "video", "document"]),
  thumbnailUrl: z.string().url().optional(),
});

const profileSkillSchema = z.object({
  name: z.string().min(1).max(120),
  level: z.string().max(50).optional(),
});

const profileExperienceSchema = z.object({
  title: z.string().min(1).max(200),
  company: z.string().max(200).optional(),
  startDate: z.string().max(40).optional(),
  endDate: z.string().max(40).optional(),
  description: z.string().max(2000).optional(),
});

const profileEducationSchema = z.object({
  school: z.string().min(1).max(200),
  degree: z.string().max(200).optional(),
  field: z.string().max(200).optional(),
  year: z.string().max(20).optional(),
});

const profileCertificateSchema = z.object({
  name: z.string().min(1).max(200),
  issuer: z.string().max(200).optional(),
  year: z.string().max(20).optional(),
});

const socialLinkSchema = z.object({
  platform: z.string().min(1).max(50),
  url: z.string().url(),
});

export const updatePersonProfileSchema = z.object({
  displayName: z.string().min(2).max(120).optional(),
  headline: z.string().max(200).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  coverUrl: z.string().url().optional().nullable(),
  privacy: z
    .enum(["public", "followers", "connections", "private", "organization_only"])
    .optional(),
  location: z.string().max(200).optional().nullable(),
  website: z.string().url().optional().nullable(),
  walletAddress: z.string().max(100).optional().nullable(),
  languages: z.array(z.string().max(50)).max(20).optional(),
  socialLinks: z.array(socialLinkSchema).max(10).optional(),
  skills: z.array(profileSkillSchema).max(50).optional(),
  experience: z.array(profileExperienceSchema).max(30).optional(),
  education: z.array(profileEducationSchema).max(20).optional(),
  certificates: z.array(profileCertificateSchema).max(20).optional(),
});

export const updateJobApplicationStatusSchema = z.object({
  postId: z.string().uuid(),
  applicantProfileId: z.string().uuid(),
  status: z.enum(["pending", "reviewed", "interview_invited", "accepted", "rejected"]),
});

export const setEventReminderSchema = z.object({
  eventId: z.string().uuid(),
});

export const searchJobsSchema = z.object({
  query: z.string().optional(),
  employmentType: z
    .enum(["full_time", "part_time", "contract", "internship", "remote"])
    .optional(),
  category: z
    .enum([
      "engineering",
      "design",
      "marketing",
      "sales",
      "operations",
      "finance",
      "hr",
      "other",
    ])
    .optional(),
  filter: z.enum(["featured", "latest", "recommended", "open"]).optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

export const searchEventsSchema = z.object({
  query: z.string().optional(),
  onlineOnly: z.boolean().optional(),
  physicalOnly: z.boolean().optional(),
  upcomingOnly: z.boolean().optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

export const searchNetworkSchema = z.object({
  query: z.string().min(1).max(200),
  type: z
    .enum([
      "all",
      "people",
      "companies",
      "posts",
      "products",
      "stores",
      "jobs",
      "events",
      "messages",
    ])
    .optional(),
  limit: z.number().int().min(1).max(50).optional(),
  offset: z.number().int().min(0).optional(),
});

export const connectionIdSchema = z.object({
  connectionId: z.string().uuid(),
});

export type CreatePersonProfileInput = z.infer<typeof createPersonProfileSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type FollowTargetInput = z.infer<typeof followTargetSchema>;
export type ConnectionRequestInput = z.infer<typeof connectionRequestSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ToggleReactionInput = z.infer<typeof toggleReactionSchema>;
export type CreatePollPostInput = z.infer<typeof createPollPostSchema>;
export type VotePollInput = z.infer<typeof votePollSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type CreateJobPostInput = z.infer<typeof createJobPostSchema>;
export type ApplyToJobInput = z.infer<typeof applyToJobSchema>;
export type RegisterForEventInput = z.infer<typeof registerForEventSchema>;
export type UpdateJobApplicationStatusInput = z.infer<typeof updateJobApplicationStatusSchema>;
export type SearchJobsInput = z.infer<typeof searchJobsSchema>;
export type SearchEventsInput = z.infer<typeof searchEventsSchema>;
export type PostMediaInput = z.infer<typeof postMediaSchema>;
export type UpdatePersonProfileInput = z.infer<typeof updatePersonProfileSchema>;
export type SearchNetworkInput = z.infer<typeof searchNetworkSchema>;
