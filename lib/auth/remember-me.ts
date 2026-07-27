import { cookies } from "next/headers";

export const REMEMBER_ME_COOKIE = "nxr_remember_me";
export const REMEMBER_ME_MAX_AGE = 30 * 24 * 60 * 60; // 30 days
export const SESSION_MAX_AGE = 24 * 60 * 60; // 1 day

export async function setRememberMePreference(enabled: boolean): Promise<void> {
  const cookieStore = await cookies();
  if (enabled) {
    cookieStore.set(REMEMBER_ME_COOKIE, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: REMEMBER_ME_MAX_AGE,
    });
  } else {
    cookieStore.delete(REMEMBER_ME_COOKIE);
  }
}

export function isRememberMeEnabled(
  cookieValue: string | undefined
): boolean {
  return cookieValue === "1";
}

export function extendCookieOptions(
  name: string,
  options: { maxAge?: number; [key: string]: unknown },
  rememberMe: boolean
): { maxAge?: number; [key: string]: unknown } {
  if (!rememberMe) return options;
  if (!name.includes("auth-token") && !name.includes("refresh-token")) {
    return options;
  }
  return { ...options, maxAge: REMEMBER_ME_MAX_AGE };
}
