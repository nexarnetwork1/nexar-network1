import "server-only";

import { randomUUID } from "node:crypto";
import { publishDomainEvent, type DomainEvent } from "@/domains";
import type {
  AtlasConnectPort,
  ConnectConversationRecord,
  ConnectMessageRecord,
  ConnectWorkspaceRecord,
} from "@/domains/contracts/ports";
import { suggestMessageActions, primaryActionForMessageType } from "./actions";
import { recommendNextActionsFromMessage } from "./ai";
import { assessMessageSpam } from "./security";
import {
  createAnnouncementRecord,
  createApprovalRecord,
  createAttachmentRecord,
  createCalendarEventRecord,
  createCallRecord,
  createChannelRecord,
  createConversationRecord,
  createMeetingRecord,
  createMessageActionRecord,
  createMessageRecord,
  createReactionRecord,
  createSharedFileRecord,
  createTaskFromMessage,
  createThreadRecord,
  ensureBusinessConnectWorkspace,
  getChannelsByWorkspace,
  getConversationById,
  getConversationsByWorkspace,
  getMeetingById,
  getMessagesByConversation,
  getParticipantsByConversation,
  getWorkspaceByBusinessId,
  getWorkspaceById,
  pinMessageRecord,
  postSystemMessage,
  searchConnectWorkspace,
  updateMeetingStatus,
  writeAuditLog,
} from "./repository";
import type {
  ConnectActionType,
  ConnectConversation,
  ConnectMessage,
  ConnectReferenceType,
  ConnectWorkspace,
  CreateConversationInput,
  SendMessageInput,
} from "./types";
import {
  createApprovalSchema,
  createCalendarEventSchema,
  createChannelSchema,
  createConversationSchema,
  reactToMessageSchema,
  scheduleMeetingSchema,
  searchConnectSchema,
  sendMessageSchema,
  shareFileSchema,
  validateSendMessageInput,
} from "./validators";
import {
  buildRealtimePayload,
  conversationChannel,
  meetingChannel,
} from "./realtime";

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

function toWorkspaceRecord(ws: ConnectWorkspace): ConnectWorkspaceRecord {
  return {
    id: ws.id,
    businessId: ws.business_id,
    name: ws.name,
    slug: ws.slug,
    isPremium: ws.is_premium,
  };
}

function toConversationRecord(c: ConnectConversation): ConnectConversationRecord {
  return {
    id: c.id,
    workspaceId: c.workspace_id,
    conversationKind: c.conversation_kind,
    title: c.title,
    messageCount: c.message_count,
    lastMessageAt: c.last_message_at ? new Date(c.last_message_at) : null,
  };
}

function toMessageRecord(m: ConnectMessage): ConnectMessageRecord {
  return {
    id: m.id,
    conversationId: m.conversation_id,
    senderUserId: m.sender_user_id,
    messageType: m.message_type,
    body: m.body,
    sentAt: new Date(m.sent_at),
    isAiGenerated: m.is_ai_generated,
  };
}

/** Ensure business owns a Connect workspace (idempotent). */
export async function ensureBusinessConnect(input: {
  businessId: string;
  ownerUserId: string;
  displayName: string;
  slug: string;
}): Promise<ConnectWorkspaceRecord> {
  const existing = await getWorkspaceByBusinessId(input.businessId);
  const workspace = await ensureBusinessConnectWorkspace(input);

  if (!existing) {
    await emit("connect.workspace_created", {
      actorId: input.ownerUserId,
      businessId: input.businessId,
      payload: {
        workspaceId: workspace.id,
        slug: workspace.slug,
      },
    });
  }

  return toWorkspaceRecord(workspace);
}

export async function getBusinessWorkspace(
  businessId: string,
): Promise<ConnectWorkspaceRecord | null> {
  const ws = await getWorkspaceByBusinessId(businessId);
  return ws ? toWorkspaceRecord(ws) : null;
}

export async function listWorkspaceConversations(
  workspaceId: string,
  limit?: number,
): Promise<ConnectConversationRecord[]> {
  const conversations = await getConversationsByWorkspace(workspaceId, limit);
  return conversations.map(toConversationRecord);
}

export async function getConversationMessages(
  conversationId: string,
  limit?: number,
): Promise<ConnectMessageRecord[]> {
  const messages = await getMessagesByConversation(conversationId, limit);
  return messages.map(toMessageRecord);
}

export async function getWorkspaceChannels(workspaceId: string) {
  return getChannelsByWorkspace(workspaceId);
}

export async function getConversationParticipants(conversationId: string) {
  return getParticipantsByConversation(conversationId);
}

export async function createChannel(input: {
  workspaceId: string;
  channelType: string;
  name: string;
  slug: string;
  description?: string;
  isPrivate?: boolean;
  createdBy: string;
  businessId?: string;
}) {
  const parsed = createChannelSchema.parse(input);
  const channel = await createChannelRecord(parsed);

  await writeAuditLog({
    workspaceId: parsed.workspaceId,
    actorUserId: parsed.createdBy,
    action: "channel.created",
    entityType: "channel",
    entityId: channel.id,
  });

  await emit("connect.channel_created", {
    actorId: parsed.createdBy,
    businessId: input.businessId ?? null,
    payload: {
      channelId: channel.id,
      workspaceId: parsed.workspaceId,
      channelType: parsed.channelType,
      slug: parsed.slug,
    },
  });

  return channel;
}

export async function sendMessage(
  input: SendMessageInput,
): Promise<ConnectMessageRecord> {
  validateSendMessageInput(input);
  sendMessageSchema.parse(input);

  const spam = assessMessageSpam({
    messageBody: input.body ?? null,
    senderUserId: input.senderUserId,
  });
  if (spam.isSpam) {
    throw new Error(`Message blocked as spam: ${spam.reasons.join(", ")}`);
  }

  const message = await createMessageRecord(input);

  const conversation = await getConversationById(input.conversationId);
  const workspace = conversation
    ? await getWorkspaceById(conversation.workspace_id)
    : null;

  await writeAuditLog({
    workspaceId: conversation?.workspace_id,
    actorUserId: input.senderUserId ?? undefined,
    action: "message.sent",
    entityType: "message",
    entityId: message.id,
  });

  await emit("connect.message_sent", {
    actorId: input.senderUserId,
    businessId: workspace?.business_id ?? null,
    payload: {
      messageId: message.id,
      conversationId: input.conversationId,
      messageType: input.messageType,
      body: input.body ?? undefined,
      nextActions: recommendNextActionsFromMessage({
        messageType: input.messageType,
        body: input.body,
      }),
      realtimeChannel: conversationChannel(input.conversationId),
      realtime: buildRealtimePayload({
        event: "message.sent",
        conversationId: input.conversationId,
        messageId: message.id,
        userId: input.senderUserId ?? undefined,
        payload: { messageType: input.messageType },
      }),
    },
  });

  const participants = await getParticipantsByConversation(input.conversationId);
  const { dispatchNotificationHub } = await import("@/modules/atlas-core/service");
  for (const participant of participants) {
    if (!participant.user_id || participant.user_id === input.senderUserId) continue;
    await dispatchNotificationHub({
      userId: participant.user_id,
      eventName: "connect.message_sent",
      title: "New message",
      body: input.body?.slice(0, 120) ?? "You have a new message.",
      channels: ["in_app", "push"],
      metadata: {
        conversationId: input.conversationId,
        messageId: message.id,
        event: "connect.message_sent",
      },
    }).catch(() => undefined);
  }

  if (input.messageType === "invoice") {
    await emit("connect.invoice_shared", {
      actorId: input.senderUserId,
      businessId: workspace?.business_id ?? null,
      payload: { messageId: message.id, conversationId: input.conversationId },
    });
  }
  if (input.messageType === "purchase_order" || input.references?.some((r) => r.referenceType === "order")) {
    await emit("connect.order_shared", {
      actorId: input.senderUserId,
      businessId: workspace?.business_id ?? null,
      payload: { messageId: message.id, conversationId: input.conversationId },
    });
  }
  if (input.messageType === "payment_link") {
    await emit("connect.payment_requested", {
      actorId: input.senderUserId,
      businessId: workspace?.business_id ?? null,
      payload: { messageId: message.id, conversationId: input.conversationId },
    });
  }

  return toMessageRecord(message);
}

export async function createConversation(
  input: CreateConversationInput,
): Promise<ConnectConversationRecord> {
  createConversationSchema.parse(input);
  const conversation = await createConversationRecord(input);

  await writeAuditLog({
    workspaceId: input.workspaceId,
    actorUserId: input.createdBy,
    action: "conversation.created",
    entityType: "conversation",
    entityId: conversation.id,
  });

  await emit("connect.conversation_created", {
    actorId: input.createdBy,
    businessId: null,
    payload: {
      conversationId: conversation.id,
      workspaceId: input.workspaceId,
      kind: input.conversationKind,
    },
  });

  return toConversationRecord(conversation);
}

export async function convertMessageToTask(input: {
  messageId: string;
  workspaceId: string;
  conversationId?: string;
  title: string;
  description?: string;
  assigneeUserId?: string;
  createdBy: string;
}): Promise<{ taskId: string }> {
  const task = await createTaskFromMessage({
    workspaceId: input.workspaceId,
    conversationId: input.conversationId,
    sourceMessageId: input.messageId,
    title: input.title,
    description: input.description,
    assigneeUserId: input.assigneeUserId,
    createdBy: input.createdBy,
  });

  await createMessageActionRecord({
    messageId: input.messageId,
    actionType: "task",
    resultEntityType: "task",
    resultEntityId: task.id,
    createdBy: input.createdBy,
  });

  await emit("connect.task_created", {
    actorId: input.createdBy,
    businessId: null,
    payload: {
      taskId: task.id,
      sourceMessageId: input.messageId,
    },
  });

  return { taskId: task.id };
}

/** Persist a smart-action conversion log; task/calendar create concrete entities. */
export async function convertMessageAction(input: {
  messageId: string;
  workspaceId: string;
  conversationId?: string;
  actionType: ConnectActionType;
  title: string;
  description?: string;
  assigneeUserId?: string;
  createdBy: string;
  dueAt?: string;
}): Promise<{ actionType: ConnectActionType; resultEntityId: string | null }> {
  if (input.actionType === "task") {
    const { taskId } = await convertMessageToTask(input);
    return { actionType: "task", resultEntityId: taskId };
  }

  if (input.actionType === "calendar_event") {
    const event = await createCalendarEventRecord({
      workspaceId: input.workspaceId,
      conversationId: input.conversationId,
      sourceMessageId: input.messageId,
      title: input.title,
      description: input.description,
      startsAt: input.dueAt ?? new Date().toISOString(),
      organizerUserId: input.createdBy,
    });
    await createMessageActionRecord({
      messageId: input.messageId,
      actionType: "calendar_event",
      resultEntityType: "calendar_event",
      resultEntityId: event.id,
      createdBy: input.createdBy,
    });
    return { actionType: "calendar_event", resultEntityId: event.id };
  }

  // Lead / customer / supplier / employee / order / invoice / CRM / note —
  // owned by other contexts; Connect records the conversion intent.
  const resultId = randomUUID();
  await createMessageActionRecord({
    messageId: input.messageId,
    actionType: input.actionType,
    resultEntityType: input.actionType,
    resultEntityId: resultId,
    createdBy: input.createdBy,
    metadata: {
      title: input.title,
      description: input.description ?? null,
      pendingExternalCreate: true,
    },
  });

  await writeAuditLog({
    workspaceId: input.workspaceId,
    actorUserId: input.createdBy,
    action: `action.convert.${input.actionType}`,
    entityType: "message",
    entityId: input.messageId,
    metadata: { resultEntityId: resultId },
  });

  return { actionType: input.actionType, resultEntityId: resultId };
}

export async function scheduleMeeting(input: {
  workspaceId: string;
  conversationId?: string;
  title: string;
  hostUserId: string;
  scheduledStart: Date;
  scheduledEnd?: Date;
  businessId?: string;
}): Promise<{ meetingId: string }> {
  scheduleMeetingSchema.parse({
    workspaceId: input.workspaceId,
    conversationId: input.conversationId,
    title: input.title,
    hostUserId: input.hostUserId,
    scheduledStart: input.scheduledStart.toISOString(),
    scheduledEnd: input.scheduledEnd?.toISOString(),
  });

  const meeting = await createMeetingRecord({
    workspaceId: input.workspaceId,
    conversationId: input.conversationId,
    title: input.title,
    hostUserId: input.hostUserId,
    scheduledStart: input.scheduledStart.toISOString(),
    scheduledEnd: input.scheduledEnd?.toISOString(),
  });

  await emit("connect.meeting_scheduled", {
    actorId: input.hostUserId,
    businessId: input.businessId ?? null,
    payload: {
      meetingId: meeting.id,
      scheduledStart: meeting.scheduled_start,
      realtime: buildRealtimePayload({
        event: "meeting.scheduled",
        workspaceId: input.workspaceId,
        payload: { meetingId: meeting.id },
      }),
    },
  });

  return { meetingId: meeting.id };
}

export async function startMeeting(input: {
  meetingId: string;
  actorUserId: string;
  businessId?: string;
}): Promise<{ meetingId: string }> {
  const existing = await getMeetingById(input.meetingId);
  if (!existing) throw new Error("Meeting not found");

  const meeting = await updateMeetingStatus(input.meetingId, "in_progress", {
    actualStart: new Date().toISOString(),
  });

  await emit("connect.meeting_started", {
    actorId: input.actorUserId,
    businessId: input.businessId ?? null,
    payload: {
      meetingId: meeting.id,
      realtimeChannel: meetingChannel(meeting.id),
      realtime: buildRealtimePayload({
        event: "meeting.started",
        workspaceId: meeting.workspace_id,
        payload: { meetingId: meeting.id },
      }),
    },
  });

  return { meetingId: meeting.id };
}

export async function endMeeting(input: {
  meetingId: string;
  actorUserId: string;
  businessId?: string;
}): Promise<{ meetingId: string }> {
  const existing = await getMeetingById(input.meetingId);
  if (!existing) throw new Error("Meeting not found");

  const meeting = await updateMeetingStatus(input.meetingId, "ended", {
    actualEnd: new Date().toISOString(),
  });

  await emit("connect.meeting_ended", {
    actorId: input.actorUserId,
    businessId: input.businessId ?? null,
    payload: {
      meetingId: meeting.id,
      realtime: buildRealtimePayload({
        event: "meeting.ended",
        workspaceId: meeting.workspace_id,
        payload: { meetingId: meeting.id },
      }),
    },
  });

  return { meetingId: meeting.id };
}

export async function startCall(input: {
  workspaceId: string;
  conversationId?: string;
  callType: "voice" | "video";
  initiatorUserId: string;
}) {
  return createCallRecord(input);
}

export async function reactToMessage(input: {
  messageId: string;
  userId: string;
  reactionType: string;
}) {
  reactToMessageSchema.parse(input);
  return createReactionRecord(input);
}

export async function attachToMessage(input: {
  messageId: string;
  fileName: string;
  mimeType?: string;
  fileSize?: number;
  storagePath: string;
  durationSeconds?: number;
  width?: number;
  height?: number;
}) {
  return createAttachmentRecord(input);
}

export async function openThread(input: {
  conversationId: string;
  rootMessageId: string;
}) {
  return createThreadRecord(input);
}

export async function pinMessage(input: {
  conversationId: string;
  messageId: string;
  pinnedBy: string;
}) {
  return pinMessageRecord(input);
}

export async function publishAnnouncement(input: {
  workspaceId: string;
  channelId?: string;
  authorUserId: string;
  title: string;
  body?: string;
  payload?: Record<string, unknown>;
  expiresAt?: string;
}) {
  return createAnnouncementRecord(input);
}

export async function requestApproval(input: {
  workspaceId: string;
  conversationId?: string;
  sourceMessageId?: string;
  title: string;
  requestedBy: string;
  approverUserId?: string;
}) {
  createApprovalSchema.parse(input);
  return createApprovalRecord(input);
}

export async function scheduleCalendarEvent(input: {
  workspaceId: string;
  conversationId?: string;
  sourceMessageId?: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
  organizerUserId: string;
  location?: string;
}) {
  createCalendarEventSchema.parse(input);
  return createCalendarEventRecord(input);
}

export async function shareBusinessFile(input: {
  workspaceId: string;
  conversationId?: string;
  uploadedBy: string;
  fileCategory: string;
  fileName: string;
  mimeType?: string;
  fileSize?: number;
  storagePath: string;
}) {
  shareFileSchema.parse(input);
  return createSharedFileRecord(input);
}

/** Share a marketplace / commerce entity into a conversation as a typed message. */
export async function shareMarketplaceEntity(input: {
  conversationId: string;
  senderUserId: string;
  referenceType: ConnectReferenceType;
  entityId: string;
  entityLabel?: string;
  messageType?: SendMessageInput["messageType"];
  body?: string;
  payload?: Record<string, unknown>;
}): Promise<ConnectMessageRecord> {
  const messageTypeMap: Partial<
    Record<ConnectReferenceType, SendMessageInput["messageType"]>
  > = {
    product: "product",
    service: "service",
    store: "marketplace_listing",
    quotation: "quotation",
    invoice: "invoice",
    order: "purchase_order",
    payment: "payment_link",
  };

  return sendMessage({
    conversationId: input.conversationId,
    senderUserId: input.senderUserId,
    messageType:
      input.messageType ?? messageTypeMap[input.referenceType] ?? "marketplace_listing",
    body: input.body ?? input.entityLabel ?? `Shared ${input.referenceType}`,
    payload: input.payload ?? {},
    references: [
      {
        referenceType: input.referenceType,
        entityId: input.entityId,
        entityLabel: input.entityLabel,
        payload: input.payload,
      },
    ],
  });
}

export async function searchWorkspace(input: {
  workspaceId: string;
  query: string;
  scopes?: Parameters<typeof searchConnectWorkspace>[0]["scopes"];
  limit?: number;
}) {
  searchConnectSchema.parse(input);
  return searchConnectWorkspace(input);
}

/** Handle ecosystem domain events → Connect notifications. */
export async function handleConnectDomainEvent(event: {
  name: string;
  actorId: string | null;
  businessId: string | null;
  payload: Record<string, unknown>;
}): Promise<void> {
  if (!event.businessId) return;

  const workspace = await getWorkspaceByBusinessId(event.businessId);
  if (!workspace) return;

  switch (event.name) {
    case "order.paid":
      await postSystemMessage({
        workspaceId: workspace.id,
        channelSlug: "marketplace",
        body: "Marketplace sale completed",
        payload: event.payload,
        senderUserId: event.actorId ?? undefined,
      });
      await emit("connect.order_shared", {
        actorId: event.actorId,
        businessId: event.businessId,
        payload: event.payload,
      });
      break;
    case "invoice.issued":
      await postSystemMessage({
        workspaceId: workspace.id,
        channelSlug: "finance",
        body: "Invoice issued",
        payload: event.payload,
        senderUserId: event.actorId ?? undefined,
      });
      await emit("connect.invoice_shared", {
        actorId: event.actorId,
        businessId: event.businessId,
        payload: event.payload,
      });
      break;
    case "payment.confirmed":
      await postSystemMessage({
        workspaceId: workspace.id,
        channelSlug: "finance",
        body: "Payment confirmed",
        payload: event.payload,
        senderUserId: event.actorId ?? undefined,
      });
      await emit("connect.payment_completed", {
        actorId: event.actorId,
        businessId: event.businessId,
        payload: event.payload,
      });
      break;
    case "employee.hired":
      await postSystemMessage({
        workspaceId: workspace.id,
        channelSlug: "hr",
        body: "New team member joined",
        payload: event.payload,
        senderUserId: event.actorId ?? undefined,
      });
      break;
    case "partner.accepted":
      await postSystemMessage({
        workspaceId: workspace.id,
        channelSlug: "general",
        body: "Partnership accepted",
        payload: event.payload,
        senderUserId: event.actorId ?? undefined,
      });
      break;
    default:
      break;
  }
}

export function createAtlasConnectPort(): AtlasConnectPort {
  return {
    async getWorkspace(businessId) {
      return getBusinessWorkspace(businessId);
    },
    async listConversations(workspaceId, limit) {
      return listWorkspaceConversations(workspaceId, limit);
    },
    async getMessages(conversationId, limit) {
      return getConversationMessages(conversationId, limit);
    },
    async sendMessage(input) {
      return sendMessage({
        conversationId: input.conversationId,
        senderUserId: input.senderUserId,
        messageType: input.messageType as SendMessageInput["messageType"],
        body: input.body,
        payload: input.payload,
        replyToId: input.replyToId,
      });
    },
    async createConversation(input) {
      return createConversation({
        workspaceId: input.workspaceId,
        conversationKind:
          input.conversationKind as CreateConversationInput["conversationKind"],
        title: input.title,
        channelId: input.channelId,
        participantUserIds: input.participantUserIds,
        createdBy: input.createdBy,
      });
    },
    async suggestActions(message) {
      return suggestMessageActions({
        messageType: message.messageType as SendMessageInput["messageType"],
        body: message.body,
        payload: message.payload,
      });
    },
    async getPrimaryAction(messageType) {
      return primaryActionForMessageType(
        messageType as SendMessageInput["messageType"],
      );
    },
    async ensureWorkspace(input) {
      return ensureBusinessConnect(input);
    },
    async listChannels(workspaceId) {
      const channels = await getChannelsByWorkspace(workspaceId);
      return channels.map((c) => ({
        id: c.id,
        workspaceId: c.workspace_id,
        channelType: c.channel_type,
        name: c.name,
        slug: c.slug,
      }));
    },
    async scheduleMeeting(input) {
      return scheduleMeeting({
        workspaceId: input.workspaceId,
        conversationId: input.conversationId,
        title: input.title,
        hostUserId: input.hostUserId,
        scheduledStart: new Date(input.scheduledStart),
        scheduledEnd: input.scheduledEnd
          ? new Date(input.scheduledEnd)
          : undefined,
        businessId: input.businessId,
      });
    },
    async convertToTask(input) {
      return convertMessageToTask(input);
    },
    async search(input) {
      return searchWorkspace({
        workspaceId: input.workspaceId,
        query: input.query,
        scopes: input.scopes as
          | import("./search").ConnectSearchScope[]
          | undefined,
        limit: input.limit,
      });
    },
  };
}

export { suggestMessageActions, primaryActionForMessageType } from "./actions";
export {
  workspaceChannel,
  conversationChannel,
  userInboxChannel,
  meetingChannel,
  presenceChannel,
  buildRealtimePayload,
  subscriptionsForWorkspace,
} from "./realtime";
export {
  CONNECT_AI_CAPABILITIES,
  createConnectAiStubResult,
  recommendNextActionsFromMessage,
} from "./ai";
export {
  CONNECT_SEARCH_SCOPES,
  rankSearchHits,
  scoreTextMatch,
  tokenizeSearchQuery,
} from "./search";
export {
  DEFAULT_CONNECT_NOTIFICATION_PREFS,
  resolveDeliveryChannels,
  buildNotificationEnvelope,
} from "./notifications";
export {
  assessMessageSpam,
  encryptionReadyDefaults,
  buildPermissionAuditEntry,
  isAttachmentSafeToShare,
} from "./security";
