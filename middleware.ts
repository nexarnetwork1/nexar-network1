import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { authConfig } from "@/config/auth";
import { applyRateLimit, handleAuthRouting } from "@/lib/middleware";
import { isSuperAdminRoute, isSuperAdminPublicRoute } from "@/lib/admin/routes";
import { getSuperAdminSessionFromRequest } from "@/lib/admin/super-admin";
import { parseSuperAdminSessionToken } from "@/lib/admin/session";
import { SUPER_ADMIN_COOKIE } from "@/lib/admin/session";

async function handleSuperAdminRouting(
  request: NextRequest
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;

  if (!isSuperAdminRoute(pathname) || isSuperAdminPublicRoute(pathname)) {
    return null;
  }

  const session = getSuperAdminSessionFromRequest(request);
  if (!session) {
    return new NextResponse("Forbidden — Super Admin wallet session required", {
      status: 403,
    });
  }

  const { supabaseResponse } = await updateSession(request);
  return supabaseResponse;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const rateLimitResponse = applyRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const superAdminResponse = await handleSuperAdminRouting(request);
  if (superAdminResponse) return superAdminResponse;

  if (authConfig.publicAuthRoutes.some((route) => pathname.startsWith(route))) {
    const { supabaseResponse } = await updateSession(request);
    return supabaseResponse;
  }

  if (authConfig.publicRoutes.some((route) => pathname.startsWith(route))) {
    const { supabaseResponse } = await updateSession(request);
    return supabaseResponse;
  }

  const { user, supabaseResponse, supabase } = await updateSession(request);

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role, profile_completed")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const authResponse = handleAuthRouting(
    request,
    user
      ? { id: user.id, email_confirmed_at: user.email_confirmed_at }
      : null,
    profile,
    supabaseResponse
  );

  const response = authResponse ?? supabaseResponse;

  // Clear stale super-admin cookie when wallet session expired
  const rawSession = request.cookies.get(SUPER_ADMIN_COOKIE)?.value;
  if (rawSession && !parseSuperAdminSessionToken(rawSession)) {
    response.cookies.delete(SUPER_ADMIN_COOKIE);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
