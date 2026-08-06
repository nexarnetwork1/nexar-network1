/**
 * ATLAS Core — notification hub contracts (pure + adapter surface).
 * Wraps modules/notifications; SMS/webhook ready stubs.
 */

export type NotificationChannel = "in_app" | "push" | "email" | "sms" | "webhook";

export type HubDispatchRequest = {
  userId: string;
  eventName: string;
  title: string;
  body: string;
  channels?: NotificationChannel[];
  businessId?: string;
  metadata?: Record<string, unknown>;
  emailTo?: string;
  sourceEventId?: string;
};

export type HubDispatchResult = {
  queued: NotificationChannel[];
  skipped: NotificationChannel[];
};

export function resolveChannels(
  requested?: NotificationChannel[],
): NotificationChannel[] {
  const defaults: NotificationChannel[] = ["in_app"];
  const list = requested?.length ? requested : defaults;
  // SMS / webhook ready but not active until configured
  return list.filter((c) => c !== "sms" && c !== "webhook");
}

export function buildHubResult(
  channels: NotificationChannel[],
  delivered: NotificationChannel[],
): HubDispatchResult {
  return {
    queued: delivered,
    skipped: channels.filter((c) => !delivered.includes(c)),
  };
}
