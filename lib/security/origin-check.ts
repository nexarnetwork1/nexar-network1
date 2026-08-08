/**
 * Cross-site request forgery protection for cookie-authenticated route handlers.
 */
import { securityLogger } from "@/lib/logging/security-logger";
import { getClientIpFromRequest } from "@/lib/security/request-context";

export type SameOriginOptions = {
  /** When true, browser mutations without Origin/Referer are rejected. */
  strict?: boolean;
};

function hostFromUrl(value: string): string | null {
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
}

function allowedHosts(request: Request): Set<string> {
  const hosts = new Set<string>();

  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) hosts.add(forwardedHost.split(",")[0].trim().toLowerCase());

  const host = request.headers.get("host");
  if (host) hosts.add(host.toLowerCase());

  const requestHost = hostFromUrl(request.url);
  if (requestHost) hosts.add(requestHost);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const appHost = appUrl ? hostFromUrl(appUrl) : null;
  if (appHost) hosts.add(appHost);

  return hosts;
}

/**
 * True when the request came from an allowed origin.
 * Non-strict mode allows missing Origin/Referer (server-to-server callers).
 * Strict mode rejects missing Origin/Referer for cookie-authenticated mutations.
 */
export function isSameOriginRequest(
  request: Request,
  options?: SameOriginOptions,
): boolean {
  const stated = request.headers.get("origin") ?? request.headers.get("referer");
  if (!stated) {
    return !options?.strict;
  }

  const statedHost = hostFromUrl(stated);
  if (!statedHost) return false;

  return allowedHosts(request).has(statedHost);
}

/** Same as `isSameOriginRequest` but records rejections for the audit trail. */
export function assertSameOrigin(
  request: Request,
  options?: SameOriginOptions,
): boolean {
  if (isSameOriginRequest(request, options)) return true;

  securityLogger.log({
    event: "csrf_failed",
    ipAddress: getClientIpFromRequest(request),
    path: new URL(request.url).pathname,
    metadata: {
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
      strict: Boolean(options?.strict),
    },
  });

  return false;
}

export function crossOriginForbiddenResponse(): Response {
  return Response.json({ error: "Cross-origin request rejected" }, { status: 403 });
}
