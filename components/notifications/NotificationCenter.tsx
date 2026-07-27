"use client";

import Link from "next/link";
import type { Notification } from "@/types";
import { markNotificationReadAction } from "@/modules/notifications/actions";

type NotificationCenterProps = {
  notifications: Notification[];
  basePath: string;
};

export function NotificationCenter({ notifications, basePath }: NotificationCenterProps) {
  if (notifications.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface/50 p-8 text-center text-muted">
        No notifications yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((n) => (
        <article
          key={n.id}
          className={`rounded-xl border p-4 ${n.read_at ? "border-border bg-surface/30" : "border-gold/30 bg-surface/60"}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">{n.type}</p>
              <h3 className="font-semibold text-white">{n.title}</h3>
              <p className="mt-1 text-sm text-muted">{n.body}</p>
              <p className="mt-2 text-xs text-muted">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </div>
            {!n.read_at && (
              <form action={markNotificationReadAction}>
                <input type="hidden" name="id" value={n.id} />
                <button type="submit" className="text-xs text-gold hover:underline">
                  Mark read
                </button>
              </form>
            )}
          </div>
          {typeof n.metadata?.order_id === "string" && (
            <Link href={`${basePath}/orders`} className="mt-2 inline-block text-xs text-gold">
              View orders →
            </Link>
          )}
        </article>
      ))}
    </div>
  );
}
