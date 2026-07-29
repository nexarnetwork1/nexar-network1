import type { NotificationPreference } from "@/types";

export function resolveNotificationPreference(
  preferences: NotificationPreference[],
  channel: NotificationPreference["channel"],
  eventType: string
): boolean {
  const match = preferences.find(
    (preference) => preference.channel === channel && preference.event_type === eventType
  );
  return match?.enabled ?? true;
}
