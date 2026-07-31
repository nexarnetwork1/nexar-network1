import { NextResponse, type NextRequest } from "next/server";
import { getDashboardPath, isValidRedirect } from "@/lib/auth/redirect";
import { commerceAuthHref, commerceAuthBasePath } from "@/lib/commerce/commerce-auth-url";
import { authConfig } from "@/config";
import { hasRoleAccess, isProtectedRoute } from "./authorization";

type Profile = {
  role: string;
  profile_completed: boolean;
};

type AuthUser = {
  id: string;
  email_confirmed_at?: string | null;
};

export function handleAuthRouting(
  request: NextRequest,
  user: AuthUser | null,
  profile: Profile | null,
  supabaseResponse: NextResponse
): NextResponse | null {
  const { pathname } = request.nextUrl;

  const isProtected = isProtectedRoute(pathname);

  const isAuthRoute = authConfig.authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!user && isProtected) {
    const isAdminProtected =
      pathname === "/admin" || pathname.startsWith("/admin/");

    const destination = isAdminProtected
      ? (() => {
          const loginUrl = new URL("/admin/login", request.url);
          loginUrl.searchParams.set("redirect", pathname);
          return loginUrl.pathname + loginUrl.search;
        })()
      : commerceAuthHref({
          auth: "signin",
          redirect: pathname,
          basePath: commerceAuthBasePath(pathname),
        });

    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (user && profile) {
    const emailVerified = Boolean(user.email_confirmed_at);
    const isVerifyRoute = pathname === authConfig.emailVerificationRoute;

    if (
      !emailVerified &&
      !isVerifyRoute &&
      !authConfig.publicAuthRoutes.some((route) => pathname.startsWith(route))
    ) {
      return NextResponse.redirect(
        new URL(authConfig.emailVerificationRoute, request.url)
      );
    }

    if (emailVerified && isVerifyRoute) {
      return NextResponse.redirect(
        new URL(getDashboardPath(profile.role), request.url)
      );
    }

    if (
      !profile.profile_completed &&
      pathname !== authConfig.profileCompletionRoute
    ) {
      return NextResponse.redirect(
        new URL(authConfig.profileCompletionRoute, request.url)
      );
    }

    if (isAuthRoute && profile.profile_completed && emailVerified) {
      const redirectParam = request.nextUrl.searchParams.get("redirect");
      const destination =
        redirectParam && isValidRedirect(redirectParam)
          ? redirectParam
          : getDashboardPath(profile.role);
      return NextResponse.redirect(new URL(destination, request.url));
    }

    if (isProtected && !hasRoleAccess(pathname, profile.role)) {
      return NextResponse.redirect(
        new URL(getDashboardPath(profile.role), request.url)
      );
    }
  }

  return supabaseResponse;
}
