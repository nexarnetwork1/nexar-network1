import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/config/env";
import { auth } from "@/auth";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";

/**
 * Server Supabase client for marketplace data.
 * When an Auth.js session exists, uses the service-role client (RLS bypass)
 * because identity is no longer a Supabase JWT. Callers must scope by user id.
 */
export async function createClient() {
  try {
    const session = await auth();
    if (session?.user?.id && isAdminClientConfigured()) {
      return createAdminClient();
    }
  } catch {
    // Fall through to anon cookie client for public reads.
  }

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
