import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { SupabaseAuthjsAdapter } from "@/lib/auth/authjs-adapter";

const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days
const SESSION_MAX_AGE_REMEMBER_SEC = 60 * 60 * 24 * 90; // 90 days

export function sessionCookieName() {
  return process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
}

export async function createDatabaseSession(
  userId: string,
  options?: { rememberMe?: boolean },
) {
  const maxAge = options?.rememberMe
    ? SESSION_MAX_AGE_REMEMBER_SEC
    : SESSION_MAX_AGE_SEC;
  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + maxAge * 1000);
  const adapter = SupabaseAuthjsAdapter();
  await adapter.createSession!({
    sessionToken,
    userId,
    expires,
  });

  const jar = await cookies();
  jar.set(sessionCookieName(), sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    expires,
  });

  return { sessionToken, expires };
}

export async function destroyDatabaseSession() {
  const jar = await cookies();
  const token = jar.get(sessionCookieName())?.value;
  if (token) {
    const adapter = SupabaseAuthjsAdapter();
    await adapter.deleteSession?.(token);
  }
  jar.set(sessionCookieName(), "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}

export async function rotateDatabaseSession(userId: string, rememberMe?: boolean) {
  await destroyDatabaseSession();
  return createDatabaseSession(userId, { rememberMe });
}
