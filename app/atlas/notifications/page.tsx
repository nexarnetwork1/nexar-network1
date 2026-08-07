import Link from "next/link";
import { Bell } from "lucide-react";
import { getPersonProfileByUserId } from "@/modules/atlas-network/repository";
import { getUserNotifications } from "@/modules/notifications/repository";
import { auth } from "@/auth";
import { AtlasGuestGate } from "@/components/atlas/app/AtlasGuestGate";
import { resolveAtlasNotificationHref } from "@/lib/atlas/notification-links";

const JOB_EVENT_EVENTS = new Set([
  "network.job_posted",
  "network.job_applied",
  "network.job_application_updated",
  "network.interview_invited",
  "network.event_registered",
  "network.event_reminder",
  "job.published",
]);

function NotificationRow({
  title,
  body,
  createdAt,
  href,
}: {
  title: string;
  body: string;
  createdAt: string;
  href: string | null;
}) {
  const shellClass =
    "block p-4 rounded-xl border border-white/10 bg-white/5 hover:border-gold/20 transition-colors";

  const content = (
    <>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted mt-0.5">{body}</p>
      <p className="text-xs text-muted mt-2">{new Date(createdAt).toLocaleString()}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={shellClass}>
        {content}
      </Link>
    );
  }

  return <div className={shellClass}>{content}</div>;
}

export default async function AtlasNotificationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <AtlasGuestGate
        title="Notifications"
        description="Sign in to see reactions, comments, and network activity."
        redirect="/atlas/notifications"
      />
    );
  }

  const [person, notifications] = await Promise.all([
    getPersonProfileByUserId(session.user.id),
    getUserNotifications(session.user.id, 40),
  ]);

  const jobEventNotifications = notifications.filter((n) => {
    const meta = (n.metadata ?? {}) as Record<string, unknown>;
    const event = meta.event as string | undefined;
    return event ? JOB_EVENT_EVENTS.has(event) : false;
  });

  const otherNotifications = notifications.filter((n) => {
    const meta = (n.metadata ?? {}) as Record<string, unknown>;
    const event = meta.event as string | undefined;
    return !event || !JOB_EVENT_EVENTS.has(event);
  });

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="h-6 w-6 text-gold" />
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted">Jobs, events, orders, and network activity</p>
        </div>
      </div>

      {person ? (
        <div className="space-y-6">
          {jobEventNotifications.length > 0 && (
            <section>
              <h2 className="font-semibold text-sm mb-3 text-gold">Jobs & Events</h2>
              <div className="space-y-2">
                {jobEventNotifications.map((n) => {
                  const meta = (n.metadata ?? {}) as Record<string, unknown>;
                  return (
                    <NotificationRow
                      key={n.id}
                      title={n.title}
                      body={n.body}
                      createdAt={n.created_at}
                      href={resolveAtlasNotificationHref(meta)}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {otherNotifications.length > 0 && (
            <section>
              <h2 className="font-semibold text-sm mb-3">All activity</h2>
              <div className="space-y-2">
                {otherNotifications.map((n) => {
                  const meta = (n.metadata ?? {}) as Record<string, unknown>;
                  return (
                    <NotificationRow
                      key={n.id}
                      title={n.title}
                      body={n.body}
                      createdAt={n.created_at}
                      href={resolveAtlasNotificationHref(meta)}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {notifications.length === 0 && (
            <div className="p-8 rounded-xl border border-white/10 bg-white/5 text-center">
              <p className="text-muted">No notifications yet.</p>
              <div className="flex flex-wrap justify-center gap-3 mt-4 text-sm">
                <Link href="/atlas/jobs" className="text-gold hover:underline">
                  Browse jobs
                </Link>
                <Link href="/atlas/events" className="text-gold hover:underline">
                  Browse events
                </Link>
                <Link href="/atlas/marketplace" className="text-gold hover:underline">
                  Marketplace
                </Link>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 rounded-xl border border-white/10 bg-white/5 text-center">
          <p className="text-muted">Create your network profile to receive notifications.</p>
          <Link href="/atlas/create-post" className="inline-block mt-4 text-gold hover:underline text-sm">
            Get started
          </Link>
        </div>
      )}
    </div>
  );
}
