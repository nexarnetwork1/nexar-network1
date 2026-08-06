import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDashboardPath, isValidRedirect } from "@/lib/auth/redirect";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceSingleSession, trackUserSession } from "@/modules/auth/session";

/**
 * Post-auth landing used after Auth.js OAuth (Google) and email verification.
 * Supabase exchangeCodeForSession has been removed.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const redirect = searchParams.get("redirect");
  const intent = searchParams.get("intent");

  const session = await auth();
  if (!session?.user?.id) {
    const role =
      intent === "merchant" || intent === "customer" ? intent : undefined;
    const loginUrl = new URL("/login", origin);
    if (redirect && isValidRedirect(redirect)) loginUrl.searchParams.set("redirect", redirect);
    if (role) loginUrl.searchParams.set("role", role);
    loginUrl.searchParams.set("message", "auth_callback_failed");
    return NextResponse.redirect(loginUrl.toString());
  }

  const userId = session.user.id;
  await enforceSingleSession(userId).catch(() => undefined);
  await trackUserSession(userId).catch(() => undefined);

  const admin = createAdminClient();
  const { data: authUser } = await admin
    .from("authjs_users")
    .select("emailVerified")
    .eq("id", userId)
    .maybeSingle();

  if (!(authUser as { emailVerified?: string | null } | null)?.emailVerified) {
    return NextResponse.redirect(`${origin}/verify-email`);
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role, profile_completed")
    .eq("id", userId)
    .maybeSingle();

  if (!profile || !(profile as { profile_completed: boolean }).profile_completed) {
    const params = new URLSearchParams();
    if (intent) params.set("intent", intent);
    const qs = params.toString();
    return NextResponse.redirect(
      `${origin}/auth/complete-profile${qs ? `?${qs}` : ""}`,
    );
  }

  if (redirect && isValidRedirect(redirect)) {
    return NextResponse.redirect(`${origin}${redirect}`);
  }

  return NextResponse.redirect(
    `${origin}${getDashboardPath((profile as { role: string }).role)}`,
  );
}
