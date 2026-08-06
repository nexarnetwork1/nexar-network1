import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import type { UserRole } from "@/types";

export type ProxyAuthUser = {
  id: string;
  email: string | null;
  emailVerified: boolean;
};

export type ProxyProfile = {
  role: UserRole;
  profile_completed: boolean;
};

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function sessionCookieName() {
  return process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
}

/** Resolve Auth.js database session for Next.js proxy/middleware. */
export async function getProxySession(request: NextRequest): Promise<{
  user: ProxyAuthUser | null;
  profile: ProxyProfile | null;
}> {
  const token = request.cookies.get(sessionCookieName())?.value;
  if (!token) return { user: null, profile: null };

  const db = serviceClient();
  if (!db) return { user: null, profile: null };

  const { data: session } = await db
    .from("authjs_sessions")
    .select("userId, expires")
    .eq("sessionToken", token)
    .maybeSingle();

  if (!session) return { user: null, profile: null };
  if (new Date((session as { expires: string }).expires) < new Date()) {
    await db.from("authjs_sessions").delete().eq("sessionToken", token);
    return { user: null, profile: null };
  }

  const userId = (session as { userId: string }).userId;
  const { data: user } = await db
    .from("authjs_users")
    .select("id, email, emailVerified")
    .eq("id", userId)
    .maybeSingle();
  if (!user) return { user: null, profile: null };

  const { data: profile } = await db
    .from("profiles")
    .select("role, profile_completed")
    .eq("id", userId)
    .maybeSingle();

  return {
    user: {
      id: (user as { id: string }).id,
      email: (user as { email: string | null }).email,
      emailVerified: Boolean((user as { emailVerified: string | null }).emailVerified),
    },
    profile: profile
      ? {
          role: (profile as ProxyProfile).role,
          profile_completed: (profile as ProxyProfile).profile_completed,
        }
      : null,
  };
}
