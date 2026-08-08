/**
 * Canonical application base URL for auth emails, OAuth callbacks, and links.
 * Prefer AUTH_URL in server contexts; never assume NEXT_PUBLIC_APP_URL matches localhost.
 */
export function getAppBaseUrl(): string {
  const candidate =
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
    "http://localhost:3000";

  return candidate.replace(/\/$/, "");
}

/** Client-safe OAuth callback origin — always the active browser origin in the browser. */
export function getOAuthCallbackOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return getAppBaseUrl();
}
