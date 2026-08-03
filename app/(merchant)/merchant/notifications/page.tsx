import { redirect } from "next/navigation";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getUserNotifications, getUnreadNotificationCount } from "@/modules/notifications/repository";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { RealtimeScope } from "@/components/realtime/RealtimeScope";
import { DashboardSection } from "@/components/dashboard";

export default async function MerchantNotificationsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect(commerceAuthHref({ auth: "signin", redirect: "/merchant/notifications" }));

  const store = await getMerchantStore(profile.id);
  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(profile.id, 50),
    getUnreadNotificationCount(profile.id),
  ]);

  return (
    <div className="space-y-6">
      <RealtimeScope userId={profile.id} storeId={store?.id} initialUnreadCount={unreadCount} />

      <DashboardSection
        as="div"
        level="h1"
        title="Notification Center"
        description="Orders, payments, and store updates"
      />

      <NotificationCenter notifications={notifications} basePath="/merchant" />
    </div>
  );
}
