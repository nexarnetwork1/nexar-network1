/**
 * Middleware helpers — re-exported from lib/middleware for a stable import path.
 * The Next.js edge entry point remains at /middleware.ts.
 */
export {
  applyRateLimit,
  getClientIp,
  handleAuthRouting,
  hasRoleAccess,
  isProtectedRoute,
} from "@/lib/middleware";
