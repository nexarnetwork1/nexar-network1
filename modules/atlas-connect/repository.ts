import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ConnectAnnouncement,
  ConnectApproval,
  ConnectAttachment,
  ConnectCalendarEvent,
  ConnectCall,
  ConnectChannel,
  ConnectConversation,
  ConnectEntityReference,
  ConnectMeeting,
  ConnectMessage,
  ConnectMessageReaction,
  ConnectParticipant,
  ConnectPinnedMessage,
  ConnectSharedFile,
  ConnectTask,
  ConnectThread,
  ConnectWorkspace,
  CreateConversationInput,
  SendMessageInput,
} from "./types";
import { DEFAULT_CONNECT_CHANNELS } from "./types";
import type { ConnectSearchHit, ConnectSearchScope } from "./search";
import { rankSearchHits, scoreTextMatch } from "./search";

function db() {
  return createAdminClient();
}

export async function getWorkspaceByBusinessId(
  businessId: string,
): Promise<ConnectWorkspace | null> {
  const { data } = await db()
    .from("atlas_connect_workspaces")
    .select("*")
    .eq("business_id", businessId)
    .is("deleted_at", null)
    .maybeSingle();
  return (data as ConnectWorkspace | null) ?? null;
}

export async function getWorkspaceById(
  workspaceId: string,
): Promise<ConnectWorkspace | null> {
  const { data } = await db()
    .from("atlas_connect_workspaces")
    .select("*")
    .eq("id", workspaceId)
    .is("deleted_at", null)
    .maybeSingle();
  return (data as ConnectWorkspace | null) ?? null;
}

export async function getChannelsByWorkspace(
  workspaceId: string,
): Promise<ConnectChannel[]> {
  const { data } = await db()
    .from("atlas_connect_channels")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("is_archived", false)
    .order("name");
  return (data as ConnectChannel[]) ?? [];
}

export async function getConversationById(
  conversationId: string,
): Promise<ConnectConversation | null> {
  const { data } = await db()
    .from("atlas_connect_conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();
  return (data as ConnectConversation | null) ?? null;
}

export async function getConversationsByWorkspace(
  workspaceId: string,
  limit = 50,
): Promise<ConnectConversation[]> {
  const { data } = await db()
    .from("atlas_connect_conversations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  return (data as ConnectConversation[]) ?? [];
}

export async function getMessagesByConversation(
  conversationId: string,
  limit = 50,
): Promise<ConnectMessage[]> {
  const { data } = await db()
    .from("atlas_connect_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("sent_at", { ascending: false })
    .limit(limit);
  return (data as ConnectMessage[]) ?? [];
}

export async function getMessageById(
  messageId: string,
): Promise<ConnectMessage | null> {
  const { data } = await db()
    .from("atlas_connect_messages")
    .select("*")
    .eq("id", messageId)
    .maybeSingle();
  return (data as ConnectMessage | null) ?? null;
}

export async function getParticipantsByConversation(
  conversationId: string,
): Promise<ConnectParticipant[]> {
  const { data } = await db()
    .from("atlas_connect_participants")
    .select("*")
    .eq("conversation_id", conversationId)
    .is("left_at", null);
  return (data as ConnectParticipant[]) ?? [];
}

export async function ensureBusinessConnectWorkspace(input: {
  businessId: string;
  ownerUserId: string;
  displayName: string;
  slug: string;
}): Promise<ConnectWorkspace> {
  let workspace = await getWorkspaceByBusinessId(input.businessId);

  if (!workspace) {
    const { data, error } = await db()
      .from("atlas_connect_workspaces")
      .insert({
        business_id: input.businessId,
        owner_user_id: input.ownerUserId,
        name: `${input.displayName} Connect`,
        slug: `${input.slug}-connect`,
        metadata: { source: "ensureBusinessConnectWorkspace" },
      })
      .select("*")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to create workspace");
    workspace = data as ConnectWorkspace;

    await db().from("atlas_connect_workspace_members").insert({
      workspace_id: workspace.id,
      user_id: input.ownerUserId,
      role: "owner",
    });

    for (const ch of DEFAULT_CONNECT_CHANNELS) {
      const { data: channel } = await db()
        .from("atlas_connect_channels")
        .insert({
          workspace_id: workspace.id,
          channel_type: ch.channelType,
          name: ch.name,
          slug: ch.slug,
          created_by: input.ownerUserId,
        })
        .select("*")
        .single();

      if (channel && ch.slug === "general") {
        const { data: conv } = await db()
          .from("atlas_connect_conversations")
          .insert({
            workspace_id: workspace.id,
            channel_id: channel.id,
            conversation_kind: "channel",
            title: ch.name,
            created_by: input.ownerUserId,
          })
          .select("*")
          .single();

        if (conv) {
          await db().from("atlas_connect_participants").insert({
            conversation_id: conv.id,
            user_id: input.ownerUserId,
            role: "owner",
          });
        }
      }
    }
  } else {
    const existing = await getChannelsByWorkspace(workspace.id);
    const existingSlugs = new Set(existing.map((c) => c.slug));
    for (const ch of DEFAULT_CONNECT_CHANNELS) {
      if (existingSlugs.has(ch.slug)) continue;
      await db().from("atlas_connect_channels").insert({
        workspace_id: workspace.id,
        channel_type: ch.channelType,
        name: ch.name,
        slug: ch.slug,
        created_by: input.ownerUserId,
      });
    }
  }

  return workspace;
}

export async function createChannelRecord(input: {
  workspaceId: string;
  channelType: string;
  name: string;
  slug: string;
  description?: string;
  isPrivate?: boolean;
  createdBy: string;
}): Promise<ConnectChannel> {
  const { data, error } = await db()
    .from("atlas_connect_channels")
    .insert({
      workspace_id: input.workspaceId,
      channel_type: input.channelType,
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      is_private: input.isPrivate ?? false,
      created_by: input.createdBy,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create channel");
  return data as ConnectChannel;
}

export async function createConversationRecord(
  input: CreateConversationInput,
): Promise<ConnectConversation> {
  const { data, error } = await db()
    .from("atlas_connect_conversations")
    .insert({
      workspace_id: input.workspaceId,
      channel_id: input.channelId ?? null,
      conversation_kind: input.conversationKind,
      title: input.title ?? null,
      external_business_id: input.externalBusinessId ?? null,
      external_user_id: input.externalUserId ?? null,
      department_id: input.departmentId ?? null,
      created_by: input.createdBy,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create conversation");

  const participants = input.participantUserIds.map((userId) => ({
    conversation_id: data.id,
    user_id: userId,
    role: userId === input.createdBy ? "owner" : "employee",
  }));
  if (participants.length) {
    await db().from("atlas_connect_participants").insert(participants);
  }

  return data as ConnectConversation;
}

export async function createMessageRecord(
  input: SendMessageInput,
): Promise<ConnectMessage> {
  const { data, error } = await db()
    .from("atlas_connect_messages")
    .insert({
      conversation_id: input.conversationId,
      sender_user_id: input.senderUserId ?? null,
      message_type: input.messageType,
      body: input.body ?? null,
      payload: input.payload ?? {},
      reply_to_id: input.replyToId ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to send message");

  const conversation = await getConversationById(input.conversationId);
  if (conversation) {
    await db()
      .from("atlas_connect_conversations")
      .update({
        last_message_at: data.sent_at,
        message_count: conversation.message_count + 1,
      })
      .eq("id", input.conversationId);
  }

  if (input.references?.length) {
    await db().from("atlas_connect_entity_references").insert(
      input.references.map((ref) => ({
        message_id: data.id,
        reference_type: ref.referenceType,
        entity_id: ref.entityId,
        entity_label: ref.entityLabel ?? null,
        payload: ref.payload ?? {},
      })),
    );
  }

  return data as ConnectMessage;
}

export async function createTaskFromMessage(input: {
  workspaceId: string;
  conversationId?: string;
  sourceMessageId: string;
  title: string;
  description?: string;
  assigneeUserId?: string;
  createdBy: string;
  dueAt?: string;
}): Promise<ConnectTask> {
  const { data, error } = await db()
    .from("atlas_connect_tasks")
    .insert({
      workspace_id: input.workspaceId,
      conversation_id: input.conversationId ?? null,
      source_message_id: input.sourceMessageId,
      title: input.title,
      description: input.description ?? null,
      assignee_user_id: input.assigneeUserId ?? null,
      created_by: input.createdBy,
      due_at: input.dueAt ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create task");
  return data as ConnectTask;
}

export async function createMessageActionRecord(input: {
  messageId: string;
  actionType: string;
  resultEntityType?: string;
  resultEntityId?: string;
  createdBy: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await db().from("atlas_connect_message_actions").insert({
    message_id: input.messageId,
    action_type: input.actionType,
    result_entity_type: input.resultEntityType ?? null,
    result_entity_id: input.resultEntityId ?? null,
    created_by: input.createdBy,
    metadata: input.metadata ?? {},
  });
}

export async function createMeetingRecord(input: {
  workspaceId: string;
  conversationId?: string;
  title: string;
  hostUserId: string;
  scheduledStart: string;
  scheduledEnd?: string;
}): Promise<ConnectMeeting> {
  const { data, error } = await db()
    .from("atlas_connect_meetings")
    .insert({
      workspace_id: input.workspaceId,
      conversation_id: input.conversationId ?? null,
      title: input.title,
      host_user_id: input.hostUserId,
      scheduled_start: input.scheduledStart,
      scheduled_end: input.scheduledEnd ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to schedule meeting");
  return data as ConnectMeeting;
}

export async function updateMeetingStatus(
  meetingId: string,
  status: "scheduled" | "in_progress" | "ended" | "cancelled",
  timestamps?: { actualStart?: string; actualEnd?: string },
): Promise<ConnectMeeting> {
  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (timestamps?.actualStart) patch.actual_start = timestamps.actualStart;
  if (timestamps?.actualEnd) patch.actual_end = timestamps.actualEnd;

  const { data, error } = await db()
    .from("atlas_connect_meetings")
    .update(patch)
    .eq("id", meetingId)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to update meeting");
  return data as ConnectMeeting;
}

export async function getMeetingById(
  meetingId: string,
): Promise<ConnectMeeting | null> {
  const { data } = await db()
    .from("atlas_connect_meetings")
    .select("*")
    .eq("id", meetingId)
    .maybeSingle();
  return (data as ConnectMeeting | null) ?? null;
}

export async function createCallRecord(input: {
  workspaceId: string;
  conversationId?: string;
  callType: "voice" | "video";
  initiatorUserId: string;
}): Promise<ConnectCall> {
  const { data, error } = await db()
    .from("atlas_connect_calls")
    .insert({
      workspace_id: input.workspaceId,
      conversation_id: input.conversationId ?? null,
      call_type: input.callType,
      initiator_user_id: input.initiatorUserId,
      status: "ringing",
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to start call");
  return data as ConnectCall;
}

export async function createReactionRecord(input: {
  messageId: string;
  userId: string;
  reactionType: string;
}): Promise<ConnectMessageReaction> {
  const { data, error } = await db()
    .from("atlas_connect_message_reactions")
    .upsert(
      {
        message_id: input.messageId,
        user_id: input.userId,
        reaction_type: input.reactionType,
      },
      { onConflict: "message_id,user_id,reaction_type" },
    )
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to react");
  return data as ConnectMessageReaction;
}

export async function createAttachmentRecord(input: {
  messageId: string;
  fileName: string;
  mimeType?: string;
  fileSize?: number;
  storagePath: string;
  durationSeconds?: number;
  width?: number;
  height?: number;
}): Promise<ConnectAttachment> {
  const { data, error } = await db()
    .from("atlas_connect_attachments")
    .insert({
      message_id: input.messageId,
      file_name: input.fileName,
      mime_type: input.mimeType ?? null,
      file_size: input.fileSize ?? null,
      storage_path: input.storagePath,
      duration_seconds: input.durationSeconds ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to attach file");
  return data as ConnectAttachment;
}

export async function createThreadRecord(input: {
  conversationId: string;
  rootMessageId: string;
}): Promise<ConnectThread> {
  const { data, error } = await db()
    .from("atlas_connect_threads")
    .insert({
      conversation_id: input.conversationId,
      root_message_id: input.rootMessageId,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create thread");
  return data as ConnectThread;
}

export async function pinMessageRecord(input: {
  conversationId: string;
  messageId: string;
  pinnedBy: string;
}): Promise<ConnectPinnedMessage> {
  const { data, error } = await db()
    .from("atlas_connect_pinned_messages")
    .upsert(
      {
        conversation_id: input.conversationId,
        message_id: input.messageId,
        pinned_by: input.pinnedBy,
      },
      { onConflict: "conversation_id,message_id" },
    )
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to pin message");

  await db()
    .from("atlas_connect_messages")
    .update({ is_pinned: true })
    .eq("id", input.messageId);

  return data as ConnectPinnedMessage;
}

export async function createAnnouncementRecord(input: {
  workspaceId: string;
  channelId?: string;
  authorUserId: string;
  title: string;
  body?: string;
  payload?: Record<string, unknown>;
  expiresAt?: string;
}): Promise<ConnectAnnouncement> {
  const { data, error } = await db()
    .from("atlas_connect_announcements")
    .insert({
      workspace_id: input.workspaceId,
      channel_id: input.channelId ?? null,
      author_user_id: input.authorUserId,
      title: input.title,
      body: input.body ?? null,
      payload: input.payload ?? {},
      expires_at: input.expiresAt ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to publish announcement");
  return data as ConnectAnnouncement;
}

export async function createApprovalRecord(input: {
  workspaceId: string;
  conversationId?: string;
  sourceMessageId?: string;
  title: string;
  requestedBy: string;
  approverUserId?: string;
}): Promise<ConnectApproval> {
  const { data, error } = await db()
    .from("atlas_connect_approvals")
    .insert({
      workspace_id: input.workspaceId,
      conversation_id: input.conversationId ?? null,
      source_message_id: input.sourceMessageId ?? null,
      title: input.title,
      requested_by: input.requestedBy,
      approver_user_id: input.approverUserId ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create approval");
  return data as ConnectApproval;
}

export async function createCalendarEventRecord(input: {
  workspaceId: string;
  conversationId?: string;
  sourceMessageId?: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
  organizerUserId: string;
  location?: string;
}): Promise<ConnectCalendarEvent> {
  const { data, error } = await db()
    .from("atlas_connect_calendar_events")
    .insert({
      workspace_id: input.workspaceId,
      conversation_id: input.conversationId ?? null,
      source_message_id: input.sourceMessageId ?? null,
      title: input.title,
      description: input.description ?? null,
      starts_at: input.startsAt,
      ends_at: input.endsAt ?? null,
      organizer_user_id: input.organizerUserId,
      location: input.location ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create calendar event");
  return data as ConnectCalendarEvent;
}

export async function createSharedFileRecord(input: {
  workspaceId: string;
  conversationId?: string;
  uploadedBy: string;
  fileCategory: string;
  fileName: string;
  mimeType?: string;
  fileSize?: number;
  storagePath: string;
}): Promise<ConnectSharedFile> {
  const { data, error } = await db()
    .from("atlas_connect_shared_files")
    .insert({
      workspace_id: input.workspaceId,
      conversation_id: input.conversationId ?? null,
      uploaded_by: input.uploadedBy,
      file_category: input.fileCategory,
      file_name: input.fileName,
      mime_type: input.mimeType ?? null,
      file_size: input.fileSize ?? null,
      storage_path: input.storagePath,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to share file");
  return data as ConnectSharedFile;
}

export async function getEntityReferencesByMessage(
  messageId: string,
): Promise<ConnectEntityReference[]> {
  const { data } = await db()
    .from("atlas_connect_entity_references")
    .select("*")
    .eq("message_id", messageId);
  return (data as ConnectEntityReference[]) ?? [];
}

export async function writeAuditLog(input: {
  workspaceId?: string;
  actorUserId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await db().from("atlas_connect_audit_logs").insert({
    workspace_id: input.workspaceId ?? null,
    actor_user_id: input.actorUserId ?? null,
    action: input.action,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });
}

export async function postSystemMessage(input: {
  workspaceId: string;
  channelSlug: string;
  body: string;
  payload?: Record<string, unknown>;
  senderUserId?: string;
}): Promise<ConnectMessage | null> {
  const { data: channel } = await db()
    .from("atlas_connect_channels")
    .select("id")
    .eq("workspace_id", input.workspaceId)
    .eq("slug", input.channelSlug)
    .maybeSingle();
  if (!channel) return null;

  let conversationId: string | null = null;
  const { data: conversation } = await db()
    .from("atlas_connect_conversations")
    .select("id")
    .eq("workspace_id", input.workspaceId)
    .eq("channel_id", channel.id)
    .limit(1)
    .maybeSingle();

  if (conversation) {
    conversationId = conversation.id;
  } else {
    const { data: created } = await db()
      .from("atlas_connect_conversations")
      .insert({
        workspace_id: input.workspaceId,
        channel_id: channel.id,
        conversation_kind: "channel",
        title: input.channelSlug,
        created_by: input.senderUserId ?? null,
      })
      .select("id")
      .single();
    conversationId = created?.id ?? null;
  }

  if (!conversationId) return null;

  return createMessageRecord({
    conversationId,
    senderUserId: input.senderUserId ?? null,
    messageType: "system",
    body: input.body,
    payload: input.payload ?? {},
  });
}

export async function searchConnectWorkspace(input: {
  workspaceId: string;
  query: string;
  scopes?: ConnectSearchScope[];
  limit?: number;
}): Promise<ConnectSearchHit[]> {
  const limit = input.limit ?? 20;
  const scopes = new Set(
    input.scopes ?? (["messages", "meetings", "files"] as ConnectSearchScope[]),
  );
  const hits: ConnectSearchHit[] = [];

  if (scopes.has("messages")) {
    const { data: convs } = await db()
      .from("atlas_connect_conversations")
      .select("id")
      .eq("workspace_id", input.workspaceId)
      .limit(500);
    const conversationIds = (convs ?? []).map((c: { id: string }) => c.id);
    if (conversationIds.length) {
      const { data } = await db()
        .from("atlas_connect_messages")
        .select("id, body, conversation_id, sent_at")
        .in("conversation_id", conversationIds)
        .ilike("body", `%${input.query}%`)
        .is("deleted_at", null)
        .limit(limit);
      for (const row of data ?? []) {
        const r = row as {
          id: string;
          body: string | null;
          conversation_id: string;
          sent_at: string;
        };
        hits.push({
          scope: "messages",
          entityId: r.id,
          title: r.body?.slice(0, 80) ?? "Message",
          snippet: r.body,
          score: scoreTextMatch(r.body ?? "", input.query),
          workspaceId: input.workspaceId,
          conversationId: r.conversation_id,
          metadata: { recencyBoost: 0.1 },
        });
      }
    }
  }

  if (scopes.has("meetings")) {
    const { data } = await db()
      .from("atlas_connect_meetings")
      .select("id, title, scheduled_start")
      .eq("workspace_id", input.workspaceId)
      .ilike("title", `%${input.query}%`)
      .limit(limit);
    for (const row of data ?? []) {
      const r = row as { id: string; title: string };
      hits.push({
        scope: "meetings",
        entityId: r.id,
        title: r.title,
        snippet: null,
        score: scoreTextMatch(r.title, input.query),
        workspaceId: input.workspaceId,
      });
    }
  }

  if (scopes.has("files")) {
    const { data } = await db()
      .from("atlas_connect_shared_files")
      .select("id, file_name, conversation_id")
      .eq("workspace_id", input.workspaceId)
      .ilike("file_name", `%${input.query}%`)
      .limit(limit);
    for (const row of data ?? []) {
      const r = row as {
        id: string;
        file_name: string;
        conversation_id: string | null;
      };
      hits.push({
        scope: "files",
        entityId: r.id,
        title: r.file_name,
        snippet: null,
        score: scoreTextMatch(r.file_name, input.query),
        workspaceId: input.workspaceId,
        conversationId: r.conversation_id ?? undefined,
      });
    }
  }

  return rankSearchHits(hits).slice(0, limit);
}

export type ConnectInboxConversation = {
  id: string;
  workspaceId: string;
  workspaceName: string;
  title: string | null;
  conversationKind: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
};

export async function getConversationsForUser(
  userId: string,
  limit = 50,
): Promise<ConnectInboxConversation[]> {
  const { data: memberships } = await db()
    .from("atlas_connect_participants")
    .select("conversation_id, last_read_at")
    .eq("user_id", userId)
    .is("left_at", null);

  const conversationIds = (memberships ?? []).map((m) => m.conversation_id as string);
  if (!conversationIds.length) return [];

  const lastReadMap = new Map(
    (memberships ?? []).map((m) => [m.conversation_id as string, m.last_read_at as string | null]),
  );

  const { data: conversations } = await db()
    .from("atlas_connect_conversations")
    .select("id, workspace_id, title, conversation_kind, last_message_at")
    .in("id", conversationIds)
    .is("archived_at", null)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (!conversations?.length) return [];

  const workspaceIds = [...new Set(conversations.map((c) => c.workspace_id as string))];
  const { data: workspaces } = await db()
    .from("atlas_connect_workspaces")
    .select("id, name")
    .in("id", workspaceIds);

  const workspaceMap = new Map(
    (workspaces ?? []).map((w) => [w.id as string, w.name as string]),
  );

  const inbox: ConnectInboxConversation[] = [];

  for (const conv of conversations) {
    const convId = conv.id as string;
    const { data: lastMsg } = await db()
      .from("atlas_connect_messages")
      .select("body, sent_at, sender_user_id")
      .eq("conversation_id", convId)
      .is("deleted_at", null)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastReadAt = lastReadMap.get(convId);
    let unreadCount = 0;
    if (lastMsg?.sent_at) {
      const { count } = await db()
        .from("atlas_connect_messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", convId)
        .is("deleted_at", null)
        .neq("sender_user_id", userId)
        .gt("sent_at", lastReadAt ?? "1970-01-01T00:00:00Z");
      unreadCount = count ?? 0;
    }

    inbox.push({
      id: convId,
      workspaceId: conv.workspace_id as string,
      workspaceName: workspaceMap.get(conv.workspace_id as string) ?? "Workspace",
      title: (conv.title as string | null) ?? null,
      conversationKind: conv.conversation_kind as string,
      lastMessageAt: (conv.last_message_at as string | null) ?? null,
      lastMessagePreview: (lastMsg?.body as string | null) ?? null,
      unreadCount,
    });
  }

  return inbox;
}

export async function updateParticipantLastRead(
  conversationId: string,
  userId: string,
): Promise<void> {
  await db()
    .from("atlas_connect_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);
}
