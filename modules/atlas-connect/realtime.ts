/**
 * ATLAS Connect — realtime subscription contracts.
 * Channel naming for WebSocket/SSE/Supabase Realtime — transport-agnostic.
 */

export type RealtimeChannel =
  | `connect:workspace:${string}`
  | `connect:conversation:${string}`
  | `connect:user:${string}`
  | `connect:meeting:${string}`
  | `connect:presence:${string}`;

export type RealtimeEventType =
  | "message.sent"
  | "message.updated"
  | "message.deleted"
  | "message.reaction"
  | "participant.joined"
  | "participant.left"
  | "typing.start"
  | "typing.stop"
  | "meeting.scheduled"
  | "meeting.started"
  | "meeting.ended"
  | "call.ringing"
  | "call.ended"
  | "task.created"
  | "approval.updated"
  | "announcement.published"
  | "presence.updated";

export type RealtimePayload = {
  event: RealtimeEventType;
  workspaceId?: string;
  conversationId?: string;
  messageId?: string;
  userId?: string;
  payload: Record<string, unknown>;
  occurredAt: string;
};

/** Workspace-wide channel — all members subscribe. */
export function workspaceChannel(workspaceId: string): RealtimeChannel {
  return `connect:workspace:${workspaceId}`;
}

/** Conversation channel — participants subscribe. */
export function conversationChannel(conversationId: string): RealtimeChannel {
  return `connect:conversation:${conversationId}`;
}

/** User inbox channel — direct notifications & mentions. */
export function userInboxChannel(userId: string): RealtimeChannel {
  return `connect:user:${userId}`;
}

/** Meeting room channel — voice/video participants. */
export function meetingChannel(meetingId: string): RealtimeChannel {
  return `connect:meeting:${meetingId}`;
}

/** Presence channel — online/away status within workspace. */
export function presenceChannel(workspaceId: string): RealtimeChannel {
  return `connect:presence:${workspaceId}`;
}

/** Build a typed realtime payload envelope. */
export function buildRealtimePayload(input: {
  event: RealtimeEventType;
  workspaceId?: string;
  conversationId?: string;
  messageId?: string;
  userId?: string;
  payload?: Record<string, unknown>;
}): RealtimePayload {
  return {
    event: input.event,
    workspaceId: input.workspaceId,
    conversationId: input.conversationId,
    messageId: input.messageId,
    userId: input.userId,
    payload: input.payload ?? {},
    occurredAt: new Date().toISOString(),
  };
}

/** Channels a user should subscribe to when entering a workspace. */
export function subscriptionsForWorkspace(
  workspaceId: string,
  userId: string,
  conversationIds: string[],
): RealtimeChannel[] {
  return [
    workspaceChannel(workspaceId),
    userInboxChannel(userId),
    presenceChannel(workspaceId),
    ...conversationIds.map(conversationChannel),
  ];
}
