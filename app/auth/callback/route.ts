import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDashboardPath, isValidRedirect } from "@/lib/auth/redirect";

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
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, profile_completed")
          .eq("id", user.id)
          .single();

        if (profile && !profile.profile_completed) {
          const params = new URLSearchParams();
          if (intent) params.set("intent", intent);
          const qs = params.toString();
          return NextResponse.redirect(
            `${origin}/auth/complete-profile${qs ? `?${qs}` : ""}`
          );
        }

        if (redirect && isValidRedirect(redirect)) {
          return NextResponse.redirect(`${origin}${redirect}`);
        }

        return NextResponse.redirect(`${origin}${getDashboardPath(profile?.role)}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
