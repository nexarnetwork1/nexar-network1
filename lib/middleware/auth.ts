import { NextResponse, type NextRequest } from "next/server";
import { getDashboardPath, isValidRedirect } from "@/lib/auth/redirect";
import { authConfig, securityConfig } from "@/config";

type Profile = {
  role: string;
  profile_completed: boolean;
};

export function handleAuthRouting(
  request: NextRequest,
  user: { id: string } | null,
  profile: Profile | null,
  supabaseResponse: NextResponse
): NextResponse | null {
  const { pathname } = request.nextUrl;

  const isProtected = securityConfig.protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  const isAuthRoute = authConfig.authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!user && isProtected) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && profile) {
    if (
      !profile.profile_completed &&
      pathname !== authConfig.profileCompletionRoute
    ) {
      return NextResponse.redirect(
        new URL(authConfig.profileCompletionRoute, request.url)
      );
    }

    if (isAuthRoute && profile.profile_completed) {
      const redirectParam = request.nextUrl.searchParams.get("redirect");
      const destination =
        redirectParam && isValidRedirect(redirectParam)
          ? redirectParam
          : getDashboardPath(profile.role);
      return NextResponse.redirect(new URL(destination, request.url));
    }

    if (isProtected) {
      const role = profile.role as keyof typeof securityConfig.roleRoutes;
      const allowedPrefixes = securityConfig.roleRoutes[role] ?? [];

      const hasAccess = allowedPrefixes.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
      );

      if (!hasAccess) {
        return NextResponse.redirect(
          new URL(getDashboardPath(profile.role), request.url)
        );
      }
    }
  }

  return supabaseResponse;
}
