import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDashboardPath, isValidRedirect } from "@/lib/auth/redirect";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";
import { enforceSingleSession, trackUserSession } from "@/modules/auth/session";

function commerceAuthFailureRedirect(
  origin: string,
  options: {
    redirect?: string | null;
    intent?: string | null;
    message?: string;
  },
): NextResponse {
  const role =
    options.intent === "merchant" || options.intent === "customer"
      ? options.intent
      : undefined;

  return NextResponse.redirect(
    `${origin}${commerceAuthHref({
      auth: "signin",
      redirect:
        options.redirect && isValidRedirect(options.redirect) ? options.redirect : undefined,
      role,
      message: options.message ?? "auth_callback_failed",
    })}`,
  );
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect");
  const intent = searchParams.get("intent");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await enforceSingleSession(user.id);
        await trackUserSession(user.id).catch(() => undefined);

        const { data: profile } = await supabase
          .from("profiles")
          .select("role, profile_completed")
          .eq("id", user.id)
          .single();

        if (!user.email_confirmed_at) {
          return NextResponse.redirect(`${origin}/verify-email`);
        }

        if (!profile || !profile.profile_completed) {
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

        return NextResponse.redirect(`${origin}${getDashboardPath(profile?.role)}`);
      }
    }

    return commerceAuthFailureRedirect(origin, { redirect, intent });
  }

  return commerceAuthFailureRedirect(origin, { redirect, intent });
}
