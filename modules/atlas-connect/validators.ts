/**
 * ATLAS Connect — Zod input validators.
 */

import { z } from "zod";

export const connectChannelTypeSchema = z.enum([
  "general",
  "sales",
  "support",
  "finance",
  "hr",
  "marketing",
  "operations",
  "development",
  "management",
  "announcements",
  "marketplace",
  "projects",
  "private",
  "public",
]);

export const connectConversationKindSchema = z.enum([
  "direct",
  "group",
  "channel",
  "business",
  "customer",
  "supplier",
  "partner",
  "department",
  "project",
  "support",
]);

export const connectMessageTypeSchema = z.enum([
  "text",
  "image",
  "video",
  "voice",
  "pdf",
  "document",
  "spreadsheet",
  "presentation",
  "product",
  "service",
  "marketplace_listing",
  "quotation",
  "invoice",
  "purchase_order",
  "payment_link",
  "wallet_transfer",
  "task",
  "calendar_event",
  "location",
  "ai_response",
  "announcement",
  "system",
]);

export const connectActionTypeSchema = z.enum([
  "task",
  "lead",
  "customer",
  "supplier",
  "employee",
  "order",
  "invoice",
  "calendar_event",
  "crm_opportunity",
  "business_note",
]);

export const connectReferenceTypeSchema = z.enum([
  "quotation",
  "invoice",
  "order",
  "payment",
  "product",
  "service",
  "store",
]);

export const connectReactionTypeSchema = z.enum([
  "like",
  "celebrate",
  "support",
  "insightful",
  "interesting",
  "love",
  "approve",
]);

export const connectFileCategorySchema = z.enum([
  "contract",
  "invoice",
  "certificate",
  "drawing",
  "company_document",
  "product_catalog",
  "media",
  "business_card",
  "general",
]);

export const sendMessageSchema = z
  .object({
    conversationId: z.string().uuid(),
    senderUserId: z.string().uuid().nullable(),
    messageType: connectMessageTypeSchema,
    body: z.string().max(50000).optional(),
    payload: z.record(z.unknown()).optional(),
    replyToId: z.string().uuid().optional(),
    references: z
      .array(
        z.object({
          referenceType: connectReferenceTypeSchema,
          entityId: z.string().uuid(),
          entityLabel: z.string().max(500).optional(),
          payload: z.record(z.unknown()).optional(),
        }),
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.messageType === "text" && !data.body?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Text messages require body",
        path: ["body"],
      });
    }
    if (data.messageType !== "system" && !data.senderUserId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "senderUserId is required for non-system messages",
        path: ["senderUserId"],
      });
    }
  });

export const createConversationSchema = z.object({
  workspaceId: z.string().uuid(),
  conversationKind: connectConversationKindSchema,
  title: z.string().min(1).max(300).optional(),
  channelId: z.string().uuid().optional(),
  participantUserIds: z.array(z.string().uuid()).min(1),
  createdBy: z.string().uuid(),
  externalBusinessId: z.string().uuid().optional(),
  externalUserId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
});

export const createChannelSchema = z.object({
  workspaceId: z.string().uuid(),
  channelType: connectChannelTypeSchema,
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(1000).optional(),
  isPrivate: z.boolean().optional(),
  createdBy: z.string().uuid(),
});

export const scheduleMeetingSchema = z.object({
  workspaceId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
  title: z.string().min(1).max(300),
  hostUserId: z.string().uuid(),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime().optional(),
});

export const convertMessageActionSchema = z.object({
  messageId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
  actionType: connectActionTypeSchema,
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  assigneeUserId: z.string().uuid().optional(),
  createdBy: z.string().uuid(),
  dueAt: z.string().datetime().optional(),
});

export const createApprovalSchema = z.object({
  workspaceId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
  sourceMessageId: z.string().uuid().optional(),
  title: z.string().min(1).max(300),
  requestedBy: z.string().uuid(),
  approverUserId: z.string().uuid().optional(),
});

export const createCalendarEventSchema = z.object({
  workspaceId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
  sourceMessageId: z.string().uuid().optional(),
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  organizerUserId: z.string().uuid(),
  location: z.string().max(500).optional(),
});

export const shareFileSchema = z.object({
  workspaceId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
  uploadedBy: z.string().uuid(),
  fileCategory: connectFileCategorySchema,
  fileName: z.string().min(1).max(500),
  mimeType: z.string().max(200).optional(),
  fileSize: z.number().int().nonnegative().optional(),
  storagePath: z.string().min(1).max(2000),
});

export const reactToMessageSchema = z.object({
  messageId: z.string().uuid(),
  userId: z.string().uuid(),
  reactionType: connectReactionTypeSchema,
});

export const searchConnectSchema = z.object({
  workspaceId: z.string().uuid(),
  query: z.string().min(1).max(200),
  scopes: z
    .array(
      z.enum([
        "messages",
        "meetings",
        "files",
        "businesses",
        "employees",
        "products",
        "orders",
        "invoices",
        "customers",
      ]),
    )
    .optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export type SendMessageSchemaInput = z.infer<typeof sendMessageSchema>;
export type CreateConversationSchemaInput = z.infer<typeof createConversationSchema>;
export type CreateChannelSchemaInput = z.infer<typeof createChannelSchema>;
export type ScheduleMeetingSchemaInput = z.infer<typeof scheduleMeetingSchema>;
export type ConvertMessageActionSchemaInput = z.infer<typeof convertMessageActionSchema>;

/** @deprecated Prefer Zod schemas; kept for call-site compatibility. */
export function isUuid(value: string): boolean {
  return z.string().uuid().safeParse(value).success;
}

export function assertUuid(value: string, field: string): void {
  if (!isUuid(value)) throw new Error(`Invalid ${field}: expected UUID`);
}

export function assertMessageType(
  value: string,
): asserts value is z.infer<typeof connectMessageTypeSchema> {
  connectMessageTypeSchema.parse(value);
}

export function assertConversationKind(
  value: string,
): asserts value is z.infer<typeof connectConversationKindSchema> {
  connectConversationKindSchema.parse(value);
}

export function assertActionType(
  value: string,
): asserts value is z.infer<typeof connectActionTypeSchema> {
  connectActionTypeSchema.parse(value);
}

export function assertReferenceType(
  value: string,
): asserts value is z.infer<typeof connectReferenceTypeSchema> {
  connectReferenceTypeSchema.parse(value);
}

export function validateSendMessageInput(input: {
  conversationId: string;
  senderUserId: string | null;
  messageType: string;
  body?: string;
}): void {
  sendMessageSchema.parse(input);
}
