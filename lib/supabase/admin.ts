import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseConfig } from "@/config/supabase";

let cached: SupabaseClient | null = null;

/**
 * Service-role client for server-side workers and Edge Functions only.
 * NEVER import this in client components or expose via NEXT_PUBLIC_ env vars.
 */
export function createAdminClient(): SupabaseClient {
  if (cached) return cached;

  const url = supabaseConfig.url;
  const key = supabaseConfig.serviceRoleKey;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL");
  }

  // Polyfill WebSocket for Node < 22 so @supabase/realtime-js can construct.
  if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const WS = require("ws") as typeof import("ws");
    (globalThis as { WebSocket: unknown }).WebSocket = WS;
  }

  cached = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return cached;
}

/** Returns admin client or null when service role env is not configured. */
export function tryCreateAdminClient(): SupabaseClient | null {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

export function isAdminClientConfigured(): boolean {
  return Boolean(supabaseConfig.url && supabaseConfig.serviceRoleKey);
}
