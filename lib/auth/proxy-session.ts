import type { NextRequest } from "next/server";
import type { UserRole } from "@/types";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { canSeeNexarHq, isPlatformOwnerRole } from "@/modules/atlas-hq/founder";

export type ProxyAuthUser = {
  id: string;
  email: string | null;
  emailVerified: boolean;
};

export type ProxyProfile = {
  role: UserRole;
  profile_completed: boolean;
};

export type ProxySession = {
  user: ProxyAuthUser | null;
  profile: ProxyProfile | null;
  /** Matches NEXAR HQ gates in server authorization (owner, staff, admin roles). */
  hqAccess: boolean;
};

function sessionCookieName() {
  return process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
}

async function resolveHqAccess(
  db: NonNullable<ReturnType<typeof tryCreateAdminClient>>,
  userId: string,
  role: string | null | undefined,
): Promise<boolean> {
  const [ownerRes, staffRes] = await Promise.all([
    db
      .from("atlas_hq_platform_owners")
      .select("user_id")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .maybeSingle(),
    db
      .from("atlas_hq_team_members")
      .select("user_id, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  const isOwner = Boolean(ownerRes.data) || isPlatformOwnerRole(role);
  const isStaff = Boolean(staffRes.data);
  return canSeeNexarHq({
    role,
    isPlatformOwner: isOwner,
    isHqStaff: isStaff,
  });
}

/** Resolve Auth.js database session for Next.js proxy. */
export async function getProxySession(request: NextRequest): Promise<ProxySession> {
  const token = request.cookies.get(sessionCookieName())?.value;
  if (!token) return { user: null, profile: null, hqAccess: false };

  const db = tryCreateAdminClient();
  if (!db) return { user: null, profile: null, hqAccess: false };

  const { data: session } = await db
    .from("authjs_sessions")
    .select("userId, expires")
    .eq("sessionToken", token)
    .maybeSingle();

  if (!session) return { user: null, profile: null, hqAccess: false };
  if (new Date((session as { expires: string }).expires) < new Date()) {
    await db.from("authjs_sessions").delete().eq("sessionToken", token);
    return { user: null, profile: null, hqAccess: false };
  }

  const userId = (session as { userId: string }).userId;
  const { data: user } = await db
    .from("authjs_users")
    .select("id, email, emailVerified")
    .eq("id", userId)
    .maybeSingle();
  if (!user) return { user: null, profile: null, hqAccess: false };

  const { data: profile } = await db
    .from("profiles")
    .select("role, profile_completed")
    .eq("id", userId)
    .maybeSingle();

  const profileRole = (profile as ProxyProfile | null)?.role ?? null;
  const hqAccess = await resolveHqAccess(db, userId, profileRole);

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
    hqAccess,
  };
}
