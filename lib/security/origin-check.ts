/**
 * Cross-site request forgery protection for cookie-authenticated route handlers.
 *
 * Server Actions already reject cross-origin submissions: Next.js compares the
 * `Origin` header against the `Host` header on every action POST and returns a
 * 403 on mismatch. Route handlers get no such treatment, so mutating handlers
 * that authenticate with an ambient cookie must check the origin themselves.
 *
 * This is the same defence the double-submit token in `lib/security/csrf.ts`
 * provides, without requiring clients to fetch and attach a token — browsers
 * have sent `Origin` on every POST since 2020, so a same-site caller always
 * passes and a cross-site caller always fails.
 *
 * Not for webhooks (Stripe is cross-origin by design and authenticates with a
 * signature) or cron endpoints (bearer token, no cookie).
 */
import { securityLogger } from "@/lib/logging/security-logger";
import { getClientIpFromRequest } from "@/lib/security/request-context";

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
 * True when the request either came from an allowed origin or carries no
 * origin information at all (server-to-server callers, which cannot ride on a
 * victim's cookies).
 */
export function isSameOriginRequest(request: Request): boolean {
  const stated = request.headers.get("origin") ?? request.headers.get("referer");
  if (!stated) return true;

  const statedHost = hostFromUrl(stated);
  if (!statedHost) return false;

  return allowedHosts(request).has(statedHost);
}

/** Same as `isSameOriginRequest` but records rejections for the audit trail. */
export function assertSameOrigin(request: Request): boolean {
  if (isSameOriginRequest(request)) return true;

  securityLogger.log({
    event: "csrf_failed",
    ipAddress: getClientIpFromRequest(request),
    path: new URL(request.url).pathname,
    metadata: {
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
    },
  });

  return false;
}

export function crossOriginForbiddenResponse(): Response {
  return Response.json({ error: "Cross-origin request rejected" }, { status: 403 });
}
