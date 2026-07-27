"use client";

import { useRouter } from "next/navigation";
import { useRealtimeSubscription } from "./useRealtimeSubscription";

/** Refreshes the page when wallet transactions change for a user-owned wallet. */
export function useRealtimeWallet(walletId?: string) {
  const router = useRouter();

  useRealtimeSubscription(`wallet:${walletId ?? "none"}`, {
    table: "wallet_transactions",
    filter: walletId ? `wallet_id=eq.${walletId}` : undefined,
    event: "INSERT",
    onChange: () => router.refresh(),
  });
}

/** Subscribes to settlements + escrows for merchant dashboard stats refresh. */
export function useRealtimeDashboard(storeId?: string) {
  const router = useRouter();

  useRealtimeSubscription(`dashboard-orders:${storeId ?? "all"}`, {
    table: "orders",
    filter: storeId ? `store_id=eq.${storeId}` : undefined,
    event: "*",
    onChange: () => router.refresh(),
  });

  useRealtimeSubscription(`dashboard-settlements:${storeId ?? "all"}`, {
    table: "settlements",
    event: "*",
    onChange: () => router.refresh(),
  });

  useRealtimeSubscription(`dashboard-escrow:${storeId ?? "all"}`, {
    table: "escrows",
    filter: storeId ? `store_id=eq.${storeId}` : undefined,
    event: "*",
    onChange: () => router.refresh(),
  });
}
