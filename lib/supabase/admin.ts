import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseConfig } from "@/config/supabase";

/**
 * Service-role client for server-side workers and Edge Functions only.
 * NEVER import this in client components or expose via NEXT_PUBLIC_ env vars.
 */
export function createAdminClient(): SupabaseClient {
  const url = supabaseConfig.url;
  const key = supabaseConfig.serviceRoleKey;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
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
