import type { UserRole } from "@/types";

/** Default destination after sign-in when no explicit redirect is provided. */
export const DEFAULT_POST_LOGIN = "/atlas";

const DASHBOARD_PATHS: Record<UserRole, string> = {
  // All roles enter ATLAS at /dashboard. The workspace layout resolves
  // the correct module tree per role from ATLAS_ROOT_MODULES.
  customer: "/dashboard",
  merchant: "/dashboard",
  business: "/dashboard",
  admin: "/dashboard",
  super_admin: "/dashboard",
  platform_owner: "/dashboard",
};

const MAX_REDIRECT_LENGTH = 2048;

export function getDashboardPath(role: UserRole | string | undefined): string {
  if (role && role in DASHBOARD_PATHS) {
    return DASHBOARD_PATHS[role as UserRole];
  }
  // Authenticated users without a known role are incomplete — never dump to Home.
  return "/auth/complete-profile";
}

/**
 * Fully decodes a candidate so that layered encodings such as `%252f%252f`
 * cannot hide an external target behind a value that looks relative.
 * Returns null when the input is malformed or nests encodings too deeply.
 */
function fullyDecode(value: string): string | null {
  let current = value;

  for (let i = 0; i < 4; i += 1) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(current);
    } catch {
      return null;
    }
    if (decoded === current) return current;
    current = decoded;
  }

  return null;
}

/** Rejects anything that is not an unambiguous path on this origin. */
function isSafeInternalPath(candidate: string): boolean {
  // Control characters and newlines can split headers or terminate the scheme
  // check early in some parsers.
  if (/[\u0000-\u001F\u007F]/.test(candidate)) return false;

  // Browsers treat a backslash as a path separator when resolving URLs, so
  // `/\evil.com` and `/\/evil.com` resolve to an external origin.
  const normalized = candidate.replace(/\\/g, "/");

  if (!normalized.startsWith("/")) return false;
  if (normalized.startsWith("//")) return false;
  if (normalized.includes("://")) return false;

  return true;
}

/**
 * True when `path` is a safe same-origin destination.
 *
 * Rejects absolute URLs, protocol-relative targets, backslash-obfuscated
 * targets, percent-encoded variants of all three, and control characters.
 */
export function isValidRedirect(path: string): boolean {
  if (typeof path !== "string") return false;
  if (path.length === 0 || path.length > MAX_REDIRECT_LENGTH) return false;

  if (!isSafeInternalPath(path)) return false;

  const decoded = fullyDecode(path);
  if (decoded === null) return false;

  return isSafeInternalPath(decoded);
}

/** Returns `path` when it is a safe internal destination, otherwise `fallback`. */
export function safeRedirect(
  path: string | null | undefined,
  fallback = DEFAULT_POST_LOGIN,
): string {
  return path && isValidRedirect(path) ? path : fallback;
}

/** Resolves post-login destination — honors requested path, never forces marketplace. */
export function resolvePostLoginRedirect(
  path: string | null | undefined,
  fallback: string = DEFAULT_POST_LOGIN,
): string {
  return safeRedirect(path, fallback);
}
