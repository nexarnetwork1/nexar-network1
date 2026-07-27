"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();
  await supabase.from("user_sessions").insert({
    user_id: userId,
    user_agent: userAgent ?? null,
    ip_address: ip ?? null,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
}

export async function enforceSingleSession(userId: string): Promise<void> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("single_session_enabled")
    .eq("id", userId)
    .single();

  if (!profile?.single_session_enabled) return;

  try {
    const admin = createAdminClient();
    await admin.auth.admin.signOut(userId, "others");
  } catch {
    // Service role not configured in dev
  }

  await supabase
    .from("user_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("revoked_at", null);
}

export async function listUserSessions(): Promise<UserSessionRecord[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("user_sessions")
    .select("id, user_agent, ip_address, created_at, last_seen_at, expires_at, revoked_at")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(20);

  return (data ?? []) as UserSessionRecord[];
}

export async function revokeCurrentSessionsOnLogout(userId: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("user_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("revoked_at", null);
}
