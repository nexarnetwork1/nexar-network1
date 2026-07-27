import { randomBytes } from "crypto";
import { cookies } from "next/headers";

const CSRF_COOKIE = "nxr_csrf";
const CSRF_HEADER = "x-csrf-token";

export async function generateCsrfToken(): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60,
  });
  return token;
}

export async function validateCsrfToken(headerToken: string | null): Promise<boolean> {
  if (!headerToken) return false;
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value;
  if (!cookieToken) return false;
  return cookieToken === headerToken;
}

export { CSRF_COOKIE, CSRF_HEADER };
