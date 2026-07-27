import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { getUserNotifications } from "@/modules/notifications/repository";
import { markNotificationReadAction } from "@/modules/notifications/actions";
import { formatDateTime } from "@/utils/format";
import { Button } from "@/components/ui/Button";

export default async function MerchantNotificationsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const notifications = await getUserNotifications(profile.id);

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold">Notifications</h1>
      <p className="mt-2 text-muted">Orders, payments, and store updates</p>

      <ul className="mt-8 space-y-3">
        {notifications.map((n) => (
          <li
            key={n.id}
            className={`rounded-2xl border px-5 py-4 ${
              n.read_at
                ? "border-border bg-card/20"
                : "border-gold/30 bg-card/40"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="mt-1 text-sm text-muted">{n.body}</p>
                <p className="mt-2 text-xs text-muted">{formatDateTime(n.created_at)}</p>
              </div>
              {!n.read_at && (
                <form action={markNotificationReadAction}>
                  <input type="hidden" name="id" value={n.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    Mark read
                  </Button>
                </form>
              )}
            </div>
          </li>
        ))}
        {notifications.length === 0 && (
          <li className="text-muted">No notifications yet.</li>
        )}
      </ul>
    </div>
  );
}
