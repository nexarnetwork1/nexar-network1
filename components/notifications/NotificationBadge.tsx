import Link from "next/link";
import { getUnreadNotificationCount } from "@/modules/notifications/repository";

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
    <Link href={href} className="relative text-muted hover:text-white">
      Notifications
      {count > 0 && (
        <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-black">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
