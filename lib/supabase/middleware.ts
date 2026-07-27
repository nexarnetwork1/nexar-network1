import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/config/env";
import {
  extendCookieOptions,
  isRememberMeEnabled,
  REMEMBER_ME_COOKIE,
} from "@/lib/auth/remember-me";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const rememberMe = isRememberMeEnabled(
    request.cookies.get(REMEMBER_ME_COOKIE)?.value
  );

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(
              name,
              value,
              extendCookieOptions(name, options ?? {}, rememberMe)
            )
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user, supabaseResponse };
}
