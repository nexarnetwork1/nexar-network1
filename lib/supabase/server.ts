import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/config/env";

/**
 * Public / anon Supabase client for server components and route handlers.
 *
 * Does NOT bypass RLS and does NOT use the service role. Identity comes from
 * Supabase cookies when present; Auth.js sessions are handled separately via
 * `createAdminClient()` in guarded server code paths.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll called from a Server Component — safe to ignore
          }
        },
      },
    },
  );
}

/** @deprecated Use createClient() instead */
export async function supabaseServer() {
  return createClient();
}
