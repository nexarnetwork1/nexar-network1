/**
 * Compatibility barrel — Wallet Super Admin removed.
 * All administration authorization is NEXAR HQ (Platform Owner + RBAC).
 */

export {
  requireHqAccess,
  requireHqAccessOrRedirect,
  getHqSession,
  hasHqAuthority,
  requireSuperAdmin,
} from "@/lib/hq/authorization";

export {
  isHqRoute,
  isHqPublicRoute,
  isSuperAdminRoute,
  isSuperAdminPublicRoute,
} from "@/lib/admin/routes";
