import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types";

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) return null;
  return data as Profile;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return getProfile(user.id);
}

export async function requireRole(roles: UserRole[]): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile || !roles.includes(profile.role)) {
    throw new Error("Unauthorized");
  }
  return profile;
}
