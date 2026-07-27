import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { authConfig } from "@/config/auth";
import { applyRateLimit, handleAuthRouting } from "@/lib/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const rateLimitResponse = applyRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

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

  return authResponse ?? supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
