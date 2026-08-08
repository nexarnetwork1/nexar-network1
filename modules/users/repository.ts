import "server-only";

import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile, UserRole } from "@/types";
import { requireHqAccess } from "@/lib/hq/authorization";

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) return null;
  return data as Profile;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return getProfile(session.user.id);
}

export async function requireRole(roles: UserRole[]): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile || !roles.includes(profile.role)) {
    throw new Error("Unauthorized");
  }
  return profile;
}

/** NEXAR HQ access via Platform Owner / HQ RBAC (resolvePermissions). */
export async function requireSuperAdmin() {
  return requireHqAccess({ permission: "hq:access" });
}
