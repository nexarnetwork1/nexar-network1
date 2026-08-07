import { NextResponse } from "next/server";
import { verifyEmailTokenAction } from "@/modules/auth/actions";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return NextResponse.redirect(
      `${origin}/login?message=auth_callback_failed`,
    );
  }

  const result = await verifyEmailTokenAction(email, token);
  if (!result.success) {
    return NextResponse.redirect(
      `${origin}/login?message=auth_callback_failed`,
    );
  }

  // Redirect to sign-in after verification — user must log in to create a session.
  return NextResponse.redirect(
    `${origin}${result.redirectTo ?? "/login?message=confirm_email"}`,
  );
}
