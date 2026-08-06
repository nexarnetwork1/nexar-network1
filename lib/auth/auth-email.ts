import { randomBytes, createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function storeToken(identifier: string, token: string, ttlMs: number) {
  const expires = new Date(Date.now() + ttlMs);
  const hashed = hashToken(token);
  const admin = createAdminClient();
  await admin
    .from("authjs_verification_tokens")
    .delete()
    .eq("identifier", identifier);
  const { error } = await admin.from("authjs_verification_tokens").insert({
    identifier,
    token: hashed,
    expires: expires.toISOString(),
  });
  if (error) throw new Error(error.message);
  return { token, hashed, expires };
}

export async function consumeToken(identifier: string, token: string) {
  const hashed = hashToken(token);
  const admin = createAdminClient();
  const { data } = await admin
    .from("authjs_verification_tokens")
    .select("*")
    .eq("identifier", identifier)
    .eq("token", hashed)
    .maybeSingle();
  if (!data) return null;
  const expires = new Date((data as { expires: string }).expires);
  await admin
    .from("authjs_verification_tokens")
    .delete()
    .eq("identifier", identifier)
    .eq("token", hashed);
  if (expires < new Date()) return null;
  return data;
}

export async function sendVerificationEmail(email: string) {
  const raw = randomBytes(32).toString("hex");
  await storeToken(`verify:${email.toLowerCase()}`, raw, 1000 * 60 * 60 * 24);
  const url = `${appUrl()}/auth/verify?token=${raw}&email=${encodeURIComponent(email)}`;
  return sendEmail({
    to: email,
    subject: "Verify your Nexar Network email",
    html: `<p>Confirm your email to finish signing up.</p><p><a href="${url}">Verify email</a></p><p>This link expires in 24 hours.</p>`,
    text: `Verify your email: ${url}`,
  });
}

export async function sendPasswordResetEmail(email: string) {
  const raw = randomBytes(32).toString("hex");
  await storeToken(`reset:${email.toLowerCase()}`, raw, 1000 * 60 * 60);
  const url = `${appUrl()}/reset-password?token=${raw}&email=${encodeURIComponent(email)}`;
  return sendEmail({
    to: email,
    subject: "Reset your Nexar Network password",
    html: `<p>Reset your password using the link below.</p><p><a href="${url}">Reset password</a></p><p>This link expires in 1 hour.</p>`,
    text: `Reset password: ${url}`,
  });
}

export async function sendChangeEmailVerification(newEmail: string, userId: string) {
  const raw = randomBytes(32).toString("hex");
  await storeToken(`change-email:${userId}:${newEmail.toLowerCase()}`, raw, 1000 * 60 * 60);
  const url = `${appUrl()}/auth/verify-email-change?token=${raw}&email=${encodeURIComponent(newEmail)}&uid=${userId}`;
  return sendEmail({
    to: newEmail,
    subject: "Confirm your new email — Nexar Network",
    html: `<p>Confirm this address as your new Nexar Network email.</p><p><a href="${url}">Confirm email change</a></p>`,
    text: `Confirm email change: ${url}`,
  });
}
