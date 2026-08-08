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

/** Treat localhost and 127.0.0.1 as the same dev host for Auth.js redirect matching. */
function normalizeAuthOrigin(origin: string): string {
  try {
    const url = new URL(origin);
    const hostname = url.hostname === "127.0.0.1" ? "localhost" : url.hostname;
    const port = url.port ? `:${url.port}` : "";
    return `${url.protocol}//${hostname}${port}`;
  } catch {
    return origin;
  }
}

function originsMatchAuthHost(a: string, b: string): boolean {
  return normalizeAuthOrigin(a) === normalizeAuthOrigin(b);
}

/**
 * Auth.js redirect callback — keep post-OAuth landing on the active host and
 * preserve `/auth/callback` query params (e.g. `redirect=/atlas`).
 */
export function resolveAuthJsRedirectUrl(url: string, baseUrl: string): string {
  if (url.startsWith("/")) return `${baseUrl}${url}`;

  try {
    const target = new URL(url);
    const base = new URL(baseUrl);

    if (originsMatchAuthHost(target.origin, base.origin)) {
      if (target.origin === base.origin) return url;
      return `${base.origin}${target.pathname}${target.search}${target.hash}`;
    }
  } catch {
    // Malformed URL — fall through to default callback.
  }

  return `${baseUrl.replace(/\/$/, "")}/auth/callback`;
}

/** Safe relative OAuth callback path for Auth.js signIn({ callbackUrl }). */
export function buildOAuthCallbackPath(destination: string | null | undefined): string {
  const redirect = safeRedirect(destination);
  return `/auth/callback?${new URLSearchParams({ redirect }).toString()}`;
}
