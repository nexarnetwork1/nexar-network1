import { type NextRequest, NextResponse } from "next/server";

/**
 * Legacy Supabase Auth session refresh — retired.
 * Identity is resolved by Auth.js database sessions in `lib/auth/proxy-session.ts`.
 * Kept as a no-op shim so older imports do not break.
 */
export async function updateSession(request: NextRequest) {
  return {
    supabase: null,
    user: null,
    supabaseResponse: NextResponse.next({
      request: { headers: request.headers },
    }),
  };
}
