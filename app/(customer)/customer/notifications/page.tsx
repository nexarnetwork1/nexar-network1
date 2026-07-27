import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { getUserNotifications, getUnreadNotificationCount } from "@/modules/notifications/repository";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { RealtimeScope } from "@/components/realtime/RealtimeScope";

export default async function CustomerNotificationsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(profile.id, 50),
    getUnreadNotificationCount(profile.id),
  ]);

  return (
    <div>
      <RealtimeScope userId={profile.id} initialUnreadCount={unreadCount} />
      <h1 className="font-heading text-3xl font-semibold">Notification Center</h1>
      <p className="mt-2 text-muted">Payment, order, dispute, and security updates</p>
      <div className="mt-8">
        <NotificationCenter notifications={notifications} basePath="/customer" />
      </div>
    </div>
  );
}
