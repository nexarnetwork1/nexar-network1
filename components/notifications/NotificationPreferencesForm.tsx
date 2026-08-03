"use client";

import { useMemo, useState, useTransition } from "react";
import {
  activeCustomerNotificationChannels,
  customerNotificationChannels,
  customerNotificationEvents,
} from "@/config/customer-notifications";
import { updateNotificationPreferenceAction } from "@/modules/notifications/actions";
import { resolveNotificationPreference } from "@/modules/notifications/preferences";
import type { NotificationPreference } from "@/types";

type NotificationPreferencesFormProps = {
  preferences: NotificationPreference[];
};

function preferenceKey(channel: string, eventType: string) {
  return `${channel}:${eventType}`;
}

export function NotificationPreferencesForm({
  preferences,
}: NotificationPreferencesFormProps) {
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const enabledMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const event of customerNotificationEvents) {
      for (const channel of activeCustomerNotificationChannels) {
        map.set(
          preferenceKey(channel.id, event.event),
          resolveNotificationPreference(localPreferences, channel.id, event.event)
        );
      }
    }
    return map;
  }, [localPreferences]);

  function setPreference(channel: string, eventType: string, enabled: boolean) {
    const key = preferenceKey(channel, eventType);
    setPendingKey(key);
    setError(null);

    setLocalPreferences((current) => {
      const existing = current.find(
        (preference) => preference.channel === channel && preference.event_type === eventType
      );

      if (existing) {
        return current.map((preference) =>
          preference.id === existing.id ? { ...preference, enabled } : preference
        );
      }

      return [
        ...current,
        {
          id: key,
          user_id: "",
          channel: channel as NotificationPreference["channel"],
          event_type: eventType,
          enabled,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    });

    startTransition(async () => {
      const result = await updateNotificationPreferenceAction(channel, eventType, enabled);
      setPendingKey(null);

      if (!result.success) {
        setError(result.error ?? "Could not update preference");
        setLocalPreferences((current) => {
          const existing = current.find(
            (preference) =>
              preference.channel === channel && preference.event_type === eventType
          );

          if (existing) {
            return current.map((preference) =>
              preference.id === existing.id
                ? { ...preference, enabled: !enabled }
                : preference
            );
          }

          return current.filter(
            (preference) =>
              !(preference.channel === channel && preference.event_type === eventType)
          );
        });
      }
    });
  }

  return (
    <div className="max-w-3xl">
      <p className="text-sm text-muted">
        Choose how you want to be notified about orders, payments, disputes, and security events.
        Disabled channels are not sent even when toggled on.
      </p>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-6 overflow-x-auto nxr-card">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Event</th>
              {activeCustomerNotificationChannels.map((channel) => (
                <th key={channel.id} className="px-4 py-3 font-medium">
                  {channel.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customerNotificationEvents.map((event) => (
              <tr key={event.event} className="border-b border-border/40 last:border-b-0">
                <td className="px-4 py-4 align-top">
                  <p className="font-medium text-white">{event.label}</p>
                  <p className="mt-1 text-xs text-muted">{event.description}</p>
                </td>
                {activeCustomerNotificationChannels.map((channel) => {
                  const key = preferenceKey(channel.id, event.event);
                  const checked = enabledMap.get(key) ?? true;
                  const isPending = pendingKey === key;

                  return (
                    <td key={channel.id} className="px-4 py-4 align-top">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={isPending}
                          onChange={(changeEvent) =>
                            setPreference(channel.id, event.event, changeEvent.target.checked)
                          }
                          className="rounded border-border"
                          aria-label={`${event.label} via ${channel.label}`}
                        />
                        <span className="sr-only">{channel.label}</span>
                      </label>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 nxr-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Coming soon</p>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          {customerNotificationChannels
            .filter((channel) => !channel.active)
            .map((channel) => (
              <li key={channel.id}>
                {channel.label} — {channel.description}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
