/**
 * Single authorization layer for Super Admin access.
 *
 * The same checks used to be re-implemented in the proxy, the wallet status
 * route, the admin layout and the admin actions, each with slightly different
 * strictness. Every caller now goes through one ordered contract:
 *
 *   1. valid HMAC signature on the `nxr_super_admin` cookie
 *   2. session not expired
 *   3. session wallet still equals the configured treasury wallet
 *
 * Permissions are unchanged — this only removes duplicate implementations.
 * Server components and actions use `getSuperAdminSession()` /
 * `requireSuperAdminSession()`; API routes with a `NextRequest` use
 * `authorizeSuperAdminRequest()`.
 */
import type { NextRequest } from "next/server";
import type { SuperAdminSession } from "@/lib/admin/session";
import {
  getSuperAdminSession,
  getSuperAdminSessionFromRequest,
  isCurrentTreasurySession,
  requireSuperAdminSession,
} from "@/lib/admin/super-admin";

/** Steps 1–3 for an API route holding a `NextRequest`. */
export async function authorizeSuperAdminRequest(
  request: NextRequest,
): Promise<SuperAdminSession | null> {
  const session = await getSuperAdminSessionFromRequest(request);
  return (await isCurrentTreasurySession(session)) ? session : null;
}

export {
  getSuperAdminSession,
  getSuperAdminSessionFromRequest,
  isCurrentTreasurySession,
  requireSuperAdminSession,
};
export type { SuperAdminSession };
