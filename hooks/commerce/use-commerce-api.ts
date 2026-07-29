"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LiveMetricsPayload } from "@/lib/commerce/types";
import {
  commerceQueryKeys,
  fetchActivity,
  fetchBrands,
  fetchLiveMetrics,
  fetchMarketplaceStatistics,
} from "@/lib/commerce/api-client";

export function useLiveMetrics(initial?: LiveMetricsPayload) {
  const query = useQuery({
    queryKey: commerceQueryKeys.live,
    queryFn: fetchLiveMetrics,
    initialData: initial
      ? { payload: initial, updated_at: new Date().toISOString() }
      : undefined,
    refetchInterval: 30_000,
  });

  const [realtimePayload, setRealtimePayload] = useState<LiveMetricsPayload | null>(
    null,
  );

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("commerce-live-metrics")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "commerce_live_metrics",
          filter: "id=eq.global",
        },
        (payload) => {
          const row = payload.new as { payload?: LiveMetricsPayload };
          if (row.payload) setRealtimePayload(row.payload);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const metrics =
    realtimePayload ?? query.data?.payload ?? initial ?? ({} as LiveMetricsPayload);

  return { metrics, isLoading: query.isLoading };
}

export function useMarketplaceStats(limit = 24) {
  return useQuery({
    queryKey: commerceQueryKeys.marketplace(limit),
    queryFn: () => fetchMarketplaceStatistics(limit),
    refetchInterval: 60_000,
  });
}

export function useCommerceBrands(limit = 50) {
  return useQuery({
    queryKey: commerceQueryKeys.brands(limit),
    queryFn: () => fetchBrands(limit),
    staleTime: 120_000,
  });
}

export function useCommerceActivity(limit = 30) {
  return useQuery({
    queryKey: commerceQueryKeys.activity(limit),
    queryFn: () => fetchActivity(limit),
    refetchInterval: 15_000,
  });
}
