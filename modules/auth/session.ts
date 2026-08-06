"use server";

import { headers } from "next/headers";
import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type UserSessionRecord = {
  id: string;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
  revoked_at: string | null;
};

export async function trackUserSession(userId: string): Promise<void> {
  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent") ?? undefined;
  const forwarded = headerStore.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim();

  const admin = createAdminClient();
  await admin.from("user_sessions").insert({
    user_id: userId,
    user_agent: userAgent ?? null,
    ip_address: ip ?? null,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
}

export async function enforceSingleSession(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("single_session_enabled")
    .eq("id", userId)
    .single();

  if (!profile?.single_session_enabled) return;

  // Keep the newest Auth.js session; revoke older DB sessions.
  const { data: sessions } = await admin
    .from("authjs_sessions")
    .select("sessionToken, expires")
    .eq("userId", userId)
    .order("expires", { ascending: false });

  if (sessions && sessions.length > 1) {
    const keep = (sessions[0] as { sessionToken: string }).sessionToken;
    await admin
      .from("authjs_sessions")
      .delete()
      .eq("userId", userId)
      .neq("sessionToken", keep);
  }

  await admin
    .from("user_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("revoked_at", null);
}

export async function listUserSessions(): Promise<UserSessionRecord[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const admin = createAdminClient();
  const { data } = await admin
    .from("user_sessions")
    .select(
      "id, user_agent, ip_address, created_at, last_seen_at, expires_at, revoked_at",
    )
    .eq("user_id", session.user.id)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(20);

  return (data ?? []) as UserSessionRecord[];
}

export async function revokeCurrentSessionsOnLogout(
  userId: string,
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("user_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("revoked_at", null);
  await admin.from("authjs_sessions").delete().eq("userId", userId);
}
