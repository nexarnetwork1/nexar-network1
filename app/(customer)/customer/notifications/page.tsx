import Link from "next/link";
import { redirect } from "next/navigation";
import { BellOff } from "lucide-react";
import { getCurrentProfile } from "@/modules/users/repository";
import { getUserNotifications, getUnreadNotificationCount } from "@/modules/notifications/repository";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { RealtimeScope } from "@/components/realtime/RealtimeScope";
import { DashboardEmptyState, DashboardSection } from "@/components/dashboard";

export default async function CustomerNotificationsPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
  redirect("/login?redirect=/customer/notifications");
}

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(profile.id, 50),
    getUnreadNotificationCount(profile.id),
  ]);

  return (
    <div className="space-y-6">
      <RealtimeScope userId={profile.id} initialUnreadCount={unreadCount} />

      <DashboardSection
        as="div"
        level="h1"
        title="Notification Center"
        description="Payment, order, dispute, and security updates"
        actions={
          <Link
            href="/customer/profile#notification-settings"
            className="rounded-lg text-sm text-gold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
          >
            Notification settings →
          </Link>
        }
      />

      {notifications.length === 0 ? (
        <DashboardEmptyState
          icon={<BellOff className="h-6 w-6" aria-hidden />}
          title="No notifications yet"
          description="Updates about your orders, payments and disputes will show up here."
        />
      ) : (
        <NotificationCenter notifications={notifications} basePath="/customer" />
      )}
    </div>
  );
}
