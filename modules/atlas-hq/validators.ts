import { z } from "zod";
import { HQ_STAFF_ROLES, HQ_WEBSITE_PAGE_KEYS } from "./types";

export const addHqTeamMemberSchema = z.object({
  email: z.string().email().max(320),
  platformRole: z.enum(HQ_STAFF_ROLES),
  status: z.enum(["active", "disabled", "invited"]).default("invited"),
  customRoleId: z.string().uuid().optional().nullable(),
});

export const updateHqTeamMemberSchema = z.object({
  memberId: z.string().uuid(),
  platformRole: z.enum(HQ_STAFF_ROLES).optional(),
  status: z.enum(["active", "disabled", "invited", "deleted"]).optional(),
  customRoleId: z.string().uuid().optional().nullable(),
});

export const hqAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  buttonText: z.string().max(80).optional().nullable(),
  buttonUrl: z.string().url().optional().nullable().or(z.literal("")),
  priority: z.number().int().min(0).max(1000).default(0),
  backgroundColor: z.string().max(32).optional().nullable(),
  textColor: z.string().max(32).optional().nullable(),
  icon: z.string().max(64).optional().nullable(),
  isEnabled: z.boolean().default(false),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
});

export const hqWebsitePageSchema = z.object({
  slug: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  pageType: z.string().max(64).default("marketing"),
  path: z.string().min(1).max(500),
  locale: z.string().max(16).default("en"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
  content: z.record(z.string(), z.unknown()).default({}),
  pageKey: z.enum(HQ_WEBSITE_PAGE_KEYS).optional(),
});

export const completeOwnerPasswordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12).max(128),
});

export type AddHqTeamMemberInput = z.infer<typeof addHqTeamMemberSchema>;
export type UpdateHqTeamMemberInput = z.infer<typeof updateHqTeamMemberSchema>;
export type HqAnnouncementInput = z.infer<typeof hqAnnouncementSchema>;
export type HqWebsitePageInput = z.infer<typeof hqWebsitePageSchema>;
