import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/config/auth";
import { applyRateLimit, handleAuthRouting } from "@/lib/middleware";
import { getProxySession } from "@/lib/auth/proxy-session";
import { isHqRoute, isHqPublicRoute } from "@/lib/admin/routes";

/**
 * NEXAR HQ gate — Auth.js session + platform role with HQ access.
 * Wallet Super Admin cookies are abolished.
 */
function handleHqRouting(
  request: NextRequest,
  user: { id: string } | null,
  hqAccess: boolean,
): NextResponse | null {
  const { pathname } = request.nextUrl;

  if (!isHqRoute(pathname) || isHqPublicRoute(pathname)) {
    return null;
  }

  if (!user) {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("redirect", pathname);
    return NextResponse.redirect(login);
  }

  if (!hqAccess) {
    return new NextResponse("Forbidden — NEXAR HQ access required", {
      status: 403,
    });
  }

  return NextResponse.next();
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const rateLimitResponse = await applyRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const { user, profile, hqAccess } = await getProxySession(request);

  const hqResponse = handleHqRouting(
    request,
    user ? { id: user.id } : null,
    hqAccess,
  );
  if (hqResponse) return hqResponse;

  const passthrough = NextResponse.next({
    request: { headers: request.headers },
  });

  if (authConfig.publicAuthRoutes.some((route) => pathname.startsWith(route))) {
    return passthrough;
  }

  if (authConfig.publicRoutes.some((route) => pathname.startsWith(route))) {
    return passthrough;
  }

  const authResponse = handleAuthRouting(
    request,
    user
      ? {
          id: user.id,
          email_confirmed_at: user.emailVerified
            ? new Date().toISOString()
            : null,
        }
      : null,
    profile,
    passthrough,
  );

  return authResponse ?? passthrough;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
