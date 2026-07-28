"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type RealtimeOptions<T extends Record<string, unknown>> = {
  table: string;
  filter?: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  onInsert?: (row: T) => void;
  onUpdate?: (row: T) => void;
  onDelete?: (row: T) => void;
  onChange?: (payload: RealtimePostgresChangesPayload<T>) => void;
};

export function useRealtimeSubscription<T extends Record<string, unknown>>(
  channelName: string,
  options: RealtimeOptions<T>
): void {
  const callbacksRef = useRef(options);

  useEffect(() => {
    callbacksRef.current = options;
  }, [options]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: options.event ?? "*",
          schema: "public",
          table: options.table,
          filter: options.filter,
        },
        (payload) => {
          callbacksRef.current.onChange?.(payload as RealtimePostgresChangesPayload<T>);
          if (payload.eventType === "INSERT") {
            callbacksRef.current.onInsert?.(payload.new as T);
          } else if (payload.eventType === "UPDATE") {
            callbacksRef.current.onUpdate?.(payload.new as T);
          } else if (payload.eventType === "DELETE") {
            callbacksRef.current.onDelete?.(payload.old as T);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelName, options.table, options.filter, options.event]);
}
