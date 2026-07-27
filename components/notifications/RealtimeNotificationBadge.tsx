"use client";

import Link from "next/link";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

type Props = {
  userId: string;
  initialCount: number;
  href?: string;
};

export function RealtimeNotificationBadge({
  userId,
  initialCount,
  href = "/customer/notifications",
}: Props) {
  const { unreadCount } = useRealtimeNotifications(userId, initialCount);

  return (
    <Link href={href} className="relative text-muted hover:text-white">
      Notifications
      {unreadCount > 0 && (
        <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-black">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
