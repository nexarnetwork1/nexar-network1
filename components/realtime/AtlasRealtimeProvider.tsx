"use client";

import { useRouter } from "next/navigation";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

type AtlasRealtimeProviderProps = {
  userId?: string;
  initialUnreadCount?: number;
  children: React.ReactNode;
};

function AtlasRealtimeSubscriptions() {
  const router = useRouter();

  useRealtimeSubscription("atlas-feed-refresh", {
    table: "atlas_network_posts",
    event: "INSERT",
    onInsert: () => router.refresh(),
  });

  useRealtimeSubscription("atlas-reactions-refresh", {
    table: "atlas_network_reactions",
    event: "*",
    onChange: () => router.refresh(),
  });

  useRealtimeSubscription("atlas-comments-refresh", {
    table: "atlas_network_comments",
    event: "INSERT",
    onInsert: () => router.refresh(),
  });

  return null;
}

/**
 * Live updates for the ATLAS shell — notifications and feed refresh.
 */
export function AtlasRealtimeProvider({
  userId,
  children,
}: AtlasRealtimeProviderProps) {
  return (
    <>
      {userId ? <AtlasRealtimeSubscriptions /> : null}
      {children}
    </>
  );
}
