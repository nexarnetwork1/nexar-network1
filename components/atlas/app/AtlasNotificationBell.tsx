"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

type Props = {
  userId: string;
  initialCount: number;
  href: string;
  isActive: boolean;
  title: string;
};

export function AtlasNotificationBell({
  userId,
  initialCount,
  href,
  isActive,
  title,
}: Props) {
  const { unreadCount } = useRealtimeNotifications(userId, initialCount);

  return (
    <Link
      href={href}
      className={cn(
        "hidden sm:flex p-2 rounded-lg transition-colors relative",
        isActive ? "text-gold bg-gold/10" : "text-muted hover:text-foreground hover:bg-foreground/5",
      )}
      title={title}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-black">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
