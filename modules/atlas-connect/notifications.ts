/**
 * ATLAS Connect — notification contracts.
 * Channels: realtime, push, email, desktop, mention, priority alerts.
 */

export type ConnectNotificationChannel =
  | "realtime"
  | "push"
  | "email"
  | "desktop"
  | "mention"
  | "priority_alert";

export type ConnectNotificationKind =
  | "message"
  | "mention"
  | "task"
  | "approval"
  | "meeting"
  | "call"
  | "announcement"
  | "payment"
  | "order"
  | "system";

export type ConnectNotificationEnvelope = {
  kind: ConnectNotificationKind;
  channels: ConnectNotificationChannel[];
  workspaceId: string;
  userId: string;
  title: string;
  body: string;
  conversationId?: string;
  entityType?: string;
  entityId?: string;
  priority: "low" | "normal" | "high" | "urgent";
  payload: Record<string, unknown>;
  occurredAt: string;
};

export type ConnectNotificationPreference = {
  realtimeEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  desktopEnabled: boolean;
  mentionEnabled: boolean;
  priorityAlertsEnabled: boolean;
};

export const DEFAULT_CONNECT_NOTIFICATION_PREFS: ConnectNotificationPreference = {
  realtimeEnabled: true,
  pushEnabled: true,
  emailEnabled: true,
  desktopEnabled: true,
  mentionEnabled: true,
  priorityAlertsEnabled: true,
};

/** Filter delivery channels against user preferences. */
export function resolveDeliveryChannels(
  prefs: ConnectNotificationPreference,
  requested: ConnectNotificationChannel[],
  kind: ConnectNotificationKind,
): ConnectNotificationChannel[] {
  return requested.filter((channel) => {
    if (channel === "realtime") return prefs.realtimeEnabled;
    if (channel === "push") return prefs.pushEnabled;
    if (channel === "email") return prefs.emailEnabled;
    if (channel === "desktop") return prefs.desktopEnabled;
    if (channel === "mention") {
      return prefs.mentionEnabled && (kind === "mention" || kind === "message");
    }
    if (channel === "priority_alert") return prefs.priorityAlertsEnabled;
    return false;
  });
}

export function buildNotificationEnvelope(input: {
  kind: ConnectNotificationKind;
  workspaceId: string;
  userId: string;
  title: string;
  body: string;
  channels?: ConnectNotificationChannel[];
  conversationId?: string;
  entityType?: string;
  entityId?: string;
  priority?: ConnectNotificationEnvelope["priority"];
  payload?: Record<string, unknown>;
}): ConnectNotificationEnvelope {
  return {
    kind: input.kind,
    channels: input.channels ?? ["realtime"],
    workspaceId: input.workspaceId,
    userId: input.userId,
    title: input.title,
    body: input.body,
    conversationId: input.conversationId,
    entityType: input.entityType,
    entityId: input.entityId,
    priority: input.priority ?? "normal",
    payload: input.payload ?? {},
    occurredAt: new Date().toISOString(),
  };
}
