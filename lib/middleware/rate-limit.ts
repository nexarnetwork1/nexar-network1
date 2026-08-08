import type { NextRequest } from "next/server";
import { rateLimitAsync } from "@/lib/security/rate-limit";
import { authConfig } from "@/config/auth";
import { securityLogger } from "@/lib/logging/security-logger";

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function matchesRoute(pathname: string, routes: readonly string[]): boolean {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/** OAuth completion routes must not consume the auth brute-force budget. */
function isOAuthFlowRoute(pathname: string): boolean {
  return matchesRoute(pathname, authConfig.publicAuthRoutes);
}

function isAuthRoute(pathname: string): boolean {
  return matchesRoute(pathname, authConfig.authRoutes);
}

/** Next.js RSC/prefetch requests reuse the page URL and were tripping auth limits. */
function isRscOrPrefetchRequest(request: NextRequest): boolean {
  return (
    request.headers.get("RSC") === "1" ||
    request.headers.get("Next-Router-Prefetch") === "1" ||
    request.headers.get("Next-Router-State-Tree") !== null
  );
}

export async function applyRateLimit(request: NextRequest): Promise<Response | null> {
  const ip = getClientIp(request);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/cron")) {
    return null;
  }

  if (isOAuthFlowRoute(pathname)) {
    return null;
  }

  if (pathname.startsWith("/api/webhooks")) {
    const { allowed } = await rateLimitAsync(`webhook:${ip}`, "api");
    if (!allowed) {
      securityLogger.rateLimitHit(ip, pathname);
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  if (isAuthRoute(pathname)) {
    // Brute-force protection targets form submissions, not page navigations or RSC flights.
    if (request.method !== "POST" || isRscOrPrefetchRequest(request)) {
      return null;
    }

    const { allowed } = await rateLimitAsync(`auth:${ip}`, "auth");
    if (!allowed) {
      securityLogger.rateLimitHit(ip, pathname);
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  if (pathname === "/api/hq/bootstrap" && request.method === "POST") {
    const { allowed } = await rateLimitAsync(`bootstrap:${ip}`, "bootstrap");
    if (!allowed) {
      securityLogger.rateLimitHit(ip, pathname);
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  if (pathname === "/api/search" && request.method !== "GET") {
    const { allowed } = await rateLimitAsync(`search:${ip}`, "search");
    if (!allowed) {
      securityLogger.rateLimitHit(ip, pathname);
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  if (
    pathname.startsWith("/api/assistant") ||
    pathname.includes("/messages")
  ) {
    const { allowed } = await rateLimitAsync(`messaging:${ip}`, "messaging");
    if (!allowed) {
      securityLogger.rateLimitHit(ip, pathname);
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  if (pathname === "/contact" || pathname.startsWith("/contact/")) {
    const { allowed } = await rateLimitAsync(`contact:${ip}`, "auth");
    if (!allowed) {
      securityLogger.rateLimitHit(ip, pathname);
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  if (pathname.includes("/checkout") || pathname.startsWith("/api/")) {
    const { allowed } = await rateLimitAsync(`api:${ip}`, "api");
    if (!allowed && !pathname.startsWith("/api/health")) {
      securityLogger.rateLimitHit(ip, pathname);
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  return null;
}
