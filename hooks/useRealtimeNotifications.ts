"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useRealtimeSubscription } from "./useRealtimeSubscription";
import type { Notification } from "@/types";

export function useRealtimeNotifications(userId: string, initialCount = 0) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(initialCount);

  const onChange = useCallback(() => {
    setUnreadCount((c) => c + 1);
    router.refresh();
  }, [router]);

  useRealtimeSubscription<Notification>(`notifications:${userId}`, {
    table: "notifications",
    filter: `user_id=eq.${userId}`,
    event: "INSERT",
    onInsert: onChange,
  });

  return { unreadCount, setUnreadCount };
}
