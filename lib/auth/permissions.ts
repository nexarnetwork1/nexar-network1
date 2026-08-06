import "server-only";

import {
  resolvePermissions,
  hasPermission,
  type Permission,
  type BusinessMemberRole,
} from "@/domains";
import type { Profile, UserRole } from "@/types";
import { getBusinessesForUser } from "@/modules/business-hub/repository";
import { AuthorizationError } from "@/lib/auth/guards";

/**
 * Resolve effective permissions for a profile.
 * Uses platform role + optional primary business membership.
 */
export async function getEffectivePermissions(
  profile: Profile,
  businessId?: string,
): Promise<Permission[]> {
  const memberships = await getBusinessesForUser(profile.id);
  const selected = businessId
    ? memberships.find((b) => b.id === businessId)
    : memberships[0];

  return resolvePermissions({
    platformRole: profile.role as UserRole,
    businessMembership: (selected?.membership.role ??
      null) as BusinessMemberRole | null,
  });
}

export async function requirePermission(
  profile: Profile,
  permission: Permission,
  businessId?: string,
): Promise<Permission[]> {
  const granted = await getEffectivePermissions(profile, businessId);
  if (!hasPermission(granted, permission)) {
    throw new AuthorizationError(`Missing permission: ${permission}`);
  }
  return granted;
}

export function roleAllowsMerchantSurface(role: UserRole | string): boolean {
  return role === "merchant" || role === "business" || role === "admin";
}
