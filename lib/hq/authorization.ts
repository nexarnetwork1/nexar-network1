/**
 * NEXAR HQ — sole platform administration authorization.
 * Platform Owner + HQ staff RBAC via resolvePermissions().
 * Wallet Super Admin has been removed.
 */

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  hasPermission,
  resolvePermissions,
  type NbosRole,
  type Permission,
} from "@/domains";
import { resolveHqSessionContext } from "@/modules/atlas-hq/service";
import type { HqSessionContext } from "@/modules/atlas-hq/types";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { isPlatformOwnerRole } from "@/modules/atlas-hq/founder";

async function loadProfileRole(userId: string): Promise<string | null> {
  const admin = tryCreateAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return (data?.role as string | null) ?? null;
}

export async function getHqSession(): Promise<HqSessionContext | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const role = await loadProfileRole(userId);
  return resolveHqSessionContext(userId, role);
}

/**
 * Require NEXAR HQ access. Optionally enforce a permission from the matrix
 * and/or an HQ module section for staff roles.
 */
export async function requireHqAccess(options?: {
  permission?: Permission;
  section?: string;
}): Promise<HqSessionContext> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }

  const role = await loadProfileRole(session.user.id);
  const ctx = await resolveHqSessionContext(session.user.id, role);

  if (!ctx.hqEnabled || !ctx.hqVisibleInSidebar) {
    throw new Error("NEXAR HQ access denied");
  }

  if (options?.section && !ctx.allowedSections.includes(options.section as never)) {
    throw new Error("NEXAR HQ section not permitted for this role");
  }

  const platformRole: NbosRole = ctx.isPlatformOwner
    ? "platform_owner"
    : isPlatformOwnerRole(role)
      ? "platform_owner"
      : role === "super_admin" || role === "admin"
        ? (role as NbosRole)
        : "admin";

  const perms = resolvePermissions({ platformRole });
  if (!hasPermission(perms, "hq:access")) {
    throw new Error("NEXAR HQ permission denied");
  }

  if (options?.permission && !hasPermission(perms, options.permission)) {
    throw new Error(`NEXAR HQ permission denied: ${options.permission}`);
  }

  return ctx;
}

/** Server Component helper — redirect to ATLAS login when HQ access missing. */
export async function requireHqAccessOrRedirect(
  options?: Parameters<typeof requireHqAccess>[0],
): Promise<HqSessionContext> {
  try {
    return await requireHqAccess(options);
  } catch {
    redirect("/admin/login");
  }
}

/**
 * @deprecated Use requireHqAccess. Kept as a thin alias so legacy call sites
 * resolve through the single HQ authorization engine.
 */
export async function requireSuperAdmin() {
  return requireHqAccess({ permission: "hq:access" });
}

/** True when the current Auth.js user may enter NEXAR HQ. */
export async function hasHqAuthority(): Promise<boolean> {
  try {
    await requireHqAccess({ permission: "hq:access" });
    return true;
  } catch {
    return false;
  }
}
