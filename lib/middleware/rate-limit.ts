import type { NextRequest } from "next/server";
import { rateLimit } from "@/lib/security/rate-limit";
import { authConfig } from "@/config/auth";
import { securityLogger } from "@/lib/logging/security-logger";

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function applyRateLimit(request: NextRequest): Response | null {
  const ip = getClientIp(request);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/webhooks")) {
    const { allowed } = rateLimit(`webhook:${ip}`, "api");
    if (!allowed) {
      securityLogger.rateLimitHit(ip, pathname);
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  if (
    authConfig.authRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    )
  ) {
    const { allowed } = rateLimit(`auth:${ip}`, "auth");
    if (!allowed) {
      securityLogger.rateLimitHit(ip, pathname);
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  if (pathname.includes("/checkout") || pathname.startsWith("/api/")) {
    const { allowed } = rateLimit(`api:${ip}`, "api");
    if (!allowed && !pathname.startsWith("/api/health")) {
      securityLogger.rateLimitHit(ip, pathname);
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  return null;
}
