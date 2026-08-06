import { z } from "zod";

export const createBusinessSchema = z.object({
  legalName: z.string().min(2).max(200),
  displayName: z.string().min(2).max(200),
  businessType: z.string().min(2).max(100).optional(),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
});

export const updateBusinessSchema = z.object({
  legalName: z.string().min(2).max(200).optional(),
  displayName: z.string().min(2).max(200).optional(),
  businessType: z.string().min(2).max(100).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  profile: z.record(z.unknown()).optional(),
  settings: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const addBusinessMemberSchema = z.object({
  businessId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(["owner", "admin", "manager", "staff", "viewer"]),
});

export const removeBusinessMemberSchema = z.object({
  businessId: z.string().uuid(),
  userId: z.string().uuid(),
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
export type AddBusinessMemberInput = z.infer<typeof addBusinessMemberSchema>;
export type RemoveBusinessMemberInput = z.infer<
  typeof removeBusinessMemberSchema
>;
