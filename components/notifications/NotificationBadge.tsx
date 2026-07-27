import { getUnreadNotificationCount } from "@/modules/notifications/repository";
import { RealtimeNotificationBadge } from "./RealtimeNotificationBadge";

type NotificationBadgeProps = {
  userId: string;
  href?: string;
};

export async function NotificationBadge({
  userId,
  href = "/customer/notifications",
}: NotificationBadgeProps) {
  const count = await getUnreadNotificationCount(userId);

  return (
    <RealtimeNotificationBadge userId={userId} initialCount={count} href={href} />
  );
}
