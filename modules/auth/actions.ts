"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import bcrypt from "bcrypt";
import { auth } from "@/auth";
import { tryCreateAdminClient, createAdminClient } from "@/lib/supabase/admin";
import { getDashboardPath, isValidRedirect } from "@/lib/auth/redirect";
import {
  createDatabaseSession,
  destroyDatabaseSession,
  rotateDatabaseSession,
} from "@/lib/auth/database-session";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendChangeEmailVerification,
  consumeToken,
} from "@/lib/auth/auth-email";
import {
  getUserPasswordHash,
  setUserPassword,
} from "@/lib/auth/authjs-adapter";
import {
  loginSchema,
  customerRegisterSchema,
  merchantRegisterSchema,
  completeProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  changeEmailSchema,
  changeWalletSchema,
} from "./validators";
import { writeSecurityLog } from "@/modules/audit/security";
import { writeAuditLog } from "@/modules/audit/repository";
import {
  enforceSingleSession,
  trackUserSession,
  revokeCurrentSessionsOnLogout,
} from "./session";
import { setRememberMePreference } from "@/lib/auth/remember-me";
import {
  checkAccountLockout,
  recordFailedLoginAttempt,
  clearLoginAttempts,
} from "@/lib/security/brute-force";
import type { UserRole } from "@/types";

const BCRYPT_ROUNDS = 12;

export type ActionResult = {
  success: boolean;
  error?: string;
  redirectTo?: string;
  needsEmailConfirmation?: boolean;
};

function slugifyStoreName(name: string, userId: string): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `store-${userId.slice(0, 8)}`;
  return base;
}

async function resolveUniqueStoreSlug(
  admin: ReturnType<typeof createAdminClient>,
  storeName: string,
  userId: string,
): Promise<string> {
  let slug = slugifyStoreName(storeName, userId);
  let counter = 0;
  while (true) {
    const { data } = await admin.from("stores").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    counter += 1;
    slug = `${slugifyStoreName(storeName, userId)}-${counter}`;
  }
}

async function requireSessionUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new Error("Not authenticated");
  return id;
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const lockout = await checkAccountLockout(email);
  if (lockout.locked) {
    const seconds = Math.ceil((lockout.retryAfterMs ?? 60_000) / 1000);
    return {
      success: false,
      error: `Too many attempts. Try again in ${seconds}s.`,
    };
  }

  const user = await getUserPasswordHash(email);
  if (!user?.password) {
    await recordFailedLoginAttempt(email);
    return { success: false, error: "Invalid email or password" };
  }

  const valid = await bcrypt.compare(parsed.data.password, user.password);
  if (!valid) {
    await recordFailedLoginAttempt(email);
    return { success: false, error: "Invalid email or password" };
  }

  if (!user.emailVerified) {
    return {
      success: false,
      error: "Please confirm your email before signing in.",
      needsEmailConfirmation: true,
    };
  }

  clearLoginAttempts(email);
  const rememberMe =
    formData.get("rememberMe") === "true" || formData.get("rememberMe") === "on";
  await rotateDatabaseSession(user.id, rememberMe);
  await setRememberMePreference(rememberMe);
  await enforceSingleSession(user.id).catch(() => undefined);
  await trackUserSession(user.id).catch(() => undefined);

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, profile_completed")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.profile_completed) {
    return { success: true, redirectTo: "/auth/complete-profile" };
  }

  await writeAuditLog({
    actorId: user.id,
    actorRole: (profile.role as UserRole) ?? "customer",
    action: "auth.login",
    entityType: "profile",
    entityId: user.id,
    metadata: { method: "credentials" },
  }).catch(() => undefined);

  try {
    const { publishDomainEvent } = await import("@/domains/events/bus");
    await publishDomainEvent({
      id: randomUUID(),
      name: "user.logged_in",
      occurredAt: new Date(),
      actorId: user.id,
      businessId: null,
      payload: { userId: user.id, method: "credentials" },
      correlationId: randomUUID(),
    });
  } catch {
    /* non-fatal */
  }

  // NEXAR HQ — Platform Owner opens ATLAS + NEXAR workspace; customers never see HQ
  try {
    const { resolveHqSessionContext } = await import(
      "@/modules/atlas-hq/service"
    );
    const { resolvePostLoginPath } = await import(
      "@/modules/atlas-hq/founder"
    );
    const hq = await resolveHqSessionContext(user.id, profile.role);
    if (hq.isPlatformOwner || hq.hqVisibleInSidebar) {
      return { success: true, redirectTo: resolvePostLoginPath(hq) };
    }
  } catch {
    /* non-fatal — fall through to role dashboard */
  }

  const redirectParam = formData.get("redirect") as string | null;
  const redirectTo =
    redirectParam && isValidRedirect(redirectParam)
      ? redirectParam
      : getDashboardPath(profile.role);

  return { success: true, redirectTo };
}

export async function registerCustomerAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = customerRegisterSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    walletAddress: formData.get("walletAddress"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const admin = tryCreateAdminClient();
  if (!admin) {
    return { success: false, error: "Server auth is not configured" };
  }

  const existing = await getUserPasswordHash(email);
  if (existing) {
    return { success: false, error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS);
  const userId = randomUUID();

  const { error: userError } = await admin.from("authjs_users").insert({
    id: userId,
    email,
    name: parsed.data.fullName,
    password: passwordHash,
    emailVerified: null,
  });
  if (userError) return { success: false, error: userError.message };

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    email,
    full_name: parsed.data.fullName,
    wallet_address: parsed.data.walletAddress.toLowerCase(),
    role: "customer",
    profile_completed: true,
  });
  if (profileError) {
    await admin.from("authjs_users").delete().eq("id", userId);
    return { success: false, error: profileError.message };
  }

  const mail = await sendVerificationEmail(email);
  if (!mail.success) {
    // Account created; surface mail failure but allow resend.
    return {
      success: true,
      needsEmailConfirmation: true,
      redirectTo: "/login?message=confirm_email",
      error: mail.error,
    };
  }

  return {
    success: true,
    needsEmailConfirmation: true,
    redirectTo: "/login?message=confirm_email",
  };
}

export async function registerMerchantAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = merchantRegisterSchema.safeParse({
    merchantName: formData.get("merchantName"),
    storeName: formData.get("storeName"),
    businessType: formData.get("businessType"),
    email: formData.get("email"),
    password: formData.get("password"),
    walletAddress: formData.get("walletAddress"),
    mode: formData.get("mode"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const admin = tryCreateAdminClient();
  if (!admin) return { success: false, error: "Server auth is not configured" };

  if (await getUserPasswordHash(email)) {
    return { success: false, error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS);
  const userId = randomUUID();

  const { error: userError } = await admin.from("authjs_users").insert({
    id: userId,
    email,
    name: parsed.data.merchantName,
    password: passwordHash,
    emailVerified: null,
  });
  if (userError) return { success: false, error: userError.message };

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    email,
    full_name: parsed.data.merchantName,
    wallet_address: parsed.data.walletAddress.toLowerCase(),
    role: "merchant",
    profile_completed: true,
  });
  if (profileError) {
    await admin.from("authjs_users").delete().eq("id", userId);
    return { success: false, error: profileError.message };
  }

  const slug = await resolveUniqueStoreSlug(admin, parsed.data.storeName, userId);
  let logoUrl: string | null = null;
  const logoFile = formData.get("logo") as File | null;
  if (logoFile && logoFile.size > 0) {
    const ext = logoFile.name.split(".").pop() ?? "png";
    const filePath = `${userId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await admin.storage
      .from("store-logos")
      .upload(filePath, logoFile, { upsert: true });
    if (!uploadError) {
      const { data: pub } = admin.storage.from("store-logos").getPublicUrl(filePath);
      logoUrl = pub.publicUrl;
    }
  }

  await admin.from("stores").insert({
    owner_id: userId,
    name: parsed.data.storeName,
    slug,
    business_type: parsed.data.businessType,
    mode: parsed.data.mode,
    status: "pending",
    logo_url: logoUrl,
    wallet_address: parsed.data.walletAddress.toLowerCase(),
  });

  // Business Hub: store insert trigger creates/links Business; ensure ownership + events.
  const { data: createdStore } = await admin
    .from("stores")
    .select("id, business_id, status")
    .eq("owner_id", userId)
    .eq("slug", slug)
    .maybeSingle();
  if (createdStore?.id) {
    const { ensureBusinessForStoreOwner } = await import(
      "@/modules/business-hub/service"
    );
    await ensureBusinessForStoreOwner({
      ownerUserId: userId,
      storeId: createdStore.id,
      storeName: parsed.data.storeName,
      storeSlug: slug,
      businessType: parsed.data.businessType,
      logoUrl,
      storeStatus: "pending",
    }).catch(() => undefined);
  }

  await sendVerificationEmail(email);

  return {
    success: true,
    needsEmailConfirmation: true,
    redirectTo: "/login?message=confirm_email",
  };
}

export async function completeProfileAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = completeProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    walletAddress: formData.get("walletAddress"),
    role: formData.get("role") || undefined,
    storeName: formData.get("storeName") || undefined,
    businessType: formData.get("businessType") || undefined,
    mode: formData.get("mode") || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const admin = createAdminClient();
  const role = (parsed.data.role ?? "customer") as UserRole;
  const { error } = await admin
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      wallet_address: parsed.data.walletAddress.toLowerCase(),
      role,
      profile_completed: true,
    })
    .eq("id", session.user.id);
  if (error) return { success: false, error: error.message };

  if (role === "merchant" && parsed.data.storeName) {
    const slug = await resolveUniqueStoreSlug(admin, parsed.data.storeName, session.user.id);
    const { data: storeRow, error: storeError } = await admin
      .from("stores")
      .insert({
        owner_id: session.user.id,
        name: parsed.data.storeName,
        slug,
        business_type: parsed.data.businessType,
        mode: parsed.data.mode ?? "marketplace",
        status: "pending",
        wallet_address: parsed.data.walletAddress.toLowerCase(),
      })
      .select("id")
      .single();
    if (storeError) return { success: false, error: storeError.message };
    if (storeRow?.id) {
      const { ensureBusinessForStoreOwner } = await import(
        "@/modules/business-hub/service"
      );
      await ensureBusinessForStoreOwner({
        ownerUserId: session.user.id,
        storeId: storeRow.id,
        storeName: parsed.data.storeName,
        storeSlug: slug,
        businessType: parsed.data.businessType,
        storeStatus: "pending",
      }).catch(() => undefined);
    }
  }

  return { success: true, redirectTo: getDashboardPath(role) };
}

export async function signOutAction(): Promise<void> {
  const session = await auth();
  if (session?.user?.id) {
    await revokeCurrentSessionsOnLogout(session.user.id).catch(() => undefined);
    await writeAuditLog({
      actorId: session.user.id,
      actorRole: "customer",
      action: "auth.logout",
      entityType: "profile",
      entityId: session.user.id,
    }).catch(() => undefined);
  }
  await destroyDatabaseSession();
  redirect("/login");
}

export async function forgotPasswordAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid email" };
  }
  const email = parsed.data.email.toLowerCase().trim();
  const user = await getUserPasswordHash(email);
  // Always succeed to avoid account enumeration.
  if (user) await sendPasswordResetEmail(email);
  return { success: true };
}

export async function resetPasswordAction(
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const token = String(formData.get("token") ?? "");
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  if (!email || !token) return { success: false, error: "Invalid reset link" };

  const consumed = await consumeToken(`reset:${email}`, token);
  if (!consumed) return { success: false, error: "Reset link expired or invalid" };

  const user = await getUserPasswordHash(email);
  if (!user) return { success: false, error: "Account not found" };

  const hash = await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS);
  await setUserPassword(user.id, hash);
  await destroyDatabaseSession();
  return { success: true, redirectTo: "/login?message=password_reset" };
}

export async function changePasswordAction(
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireSessionUserId();
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const admin = createAdminClient();
  const { data: user } = await admin
    .from("authjs_users")
    .select("password, email")
    .eq("id", userId)
    .single();
  if (!user?.password) return { success: false, error: "Password login not available" };

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!ok) return { success: false, error: "Current password is incorrect" };

  const hash = await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS);
  await setUserPassword(userId, hash);
  await rotateDatabaseSession(userId);
  return { success: true };
}

export async function resendConfirmationAction(
  formData: FormData,
): Promise<ActionResult> {
  const email = formData.get("email");
  if (typeof email !== "string" || !email.includes("@")) {
    return { success: false, error: "Valid email required" };
  }
  const user = await getUserPasswordHash(email.toLowerCase().trim());
  if (!user) return { success: true };
  if (user.emailVerified) return { success: true };
  const mail = await sendVerificationEmail(user.email);
  if (!mail.success) return { success: false, error: mail.error ?? "Failed to send email" };
  return { success: true };
}

export async function updateProfileAction(
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireSessionUserId();
  const parsed = updateProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    singleSession:
      formData.get("singleSession") === "on" ||
      formData.get("singleSession") === "true",
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      single_session_enabled: parsed.data.singleSession ?? false,
    })
    .eq("id", userId);
  if (error) return { success: false, error: error.message };
  await admin
    .from("authjs_users")
    .update({ name: parsed.data.fullName, updated_at: new Date().toISOString() })
    .eq("id", userId);
  return { success: true };
}

export async function changeEmailAction(
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireSessionUserId();
  const parsed = changeEmailSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const admin = createAdminClient();
  const { data: user } = await admin
    .from("authjs_users")
    .select("password")
    .eq("id", userId)
    .single();
  if (!user?.password) return { success: false, error: "Password required" };
  const ok = await bcrypt.compare(parsed.data.password, user.password);
  if (!ok) return { success: false, error: "Password is incorrect" };

  const mail = await sendChangeEmailVerification(
    parsed.data.email.toLowerCase().trim(),
    userId,
  );
  if (!mail.success) return { success: false, error: mail.error ?? "Failed to send email" };
  return { success: true };
}

export async function changeWalletAction(
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireSessionUserId();
  const parsed = changeWalletSchema.safeParse({
    walletAddress: formData.get("walletAddress"),
    confirmWalletAddress: formData.get("confirmWalletAddress"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const admin = createAdminClient();
  const { data: user } = await admin
    .from("authjs_users")
    .select("password")
    .eq("id", userId)
    .single();
  if (!user?.password) return { success: false, error: "Password required" };
  const ok = await bcrypt.compare(parsed.data.password, user.password);
  if (!ok) return { success: false, error: "Password is incorrect" };

  const wallet = parsed.data.walletAddress.toLowerCase();
  const { data: taken } = await admin
    .from("profiles")
    .select("id")
    .ilike("wallet_address", wallet)
    .neq("id", userId)
    .maybeSingle();
  if (taken) return { success: false, error: "Wallet already linked to another account" };

  const { error } = await admin
    .from("profiles")
    .update({ wallet_address: wallet })
    .eq("id", userId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function linkOrLoginWalletAction(
  walletAddress: string,
): Promise<ActionResult> {
  const wallet = walletAddress.toLowerCase();
  if (!/^0x[a-f0-9]{40}$/.test(wallet)) {
    return { success: false, error: "Invalid wallet address" };
  }

  const admin = createAdminClient();
  const session = await auth();

  const { data: linked } = await admin
    .from("profiles")
    .select("id, role, profile_completed")
    .ilike("wallet_address", wallet)
    .maybeSingle();

  if (linked) {
    if (session?.user?.id && session.user.id !== linked.id) {
      return {
        success: false,
        error: "This wallet is already linked to another account.",
      };
    }
    await rotateDatabaseSession(linked.id);
    await trackUserSession(linked.id).catch(() => undefined);
    if (!linked.profile_completed) {
      return { success: true, redirectTo: "/auth/complete-profile" };
    }
    return { success: true, redirectTo: getDashboardPath(linked.role) };
  }

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Sign in or register first, then connect your wallet to link it.",
    };
  }

  const { error } = await admin
    .from("profiles")
    .update({ wallet_address: wallet })
    .eq("id", session.user.id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function revokeSessionAction(
  sessionIdOrFormData: string | FormData,
): Promise<ActionResult> {
  const userId = await requireSessionUserId();
  const sessionId =
    typeof sessionIdOrFormData === "string"
      ? sessionIdOrFormData
      : String(sessionIdOrFormData.get("sessionId") ?? "");
  if (!sessionId) {
    return { success: false, error: "Session id required" };
  }
  const admin = createAdminClient();
  const { error } = await admin.rpc("revoke_user_session", {
    p_user_id: userId,
    p_session_id: sessionId,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function revokeOtherSessionsAction(): Promise<ActionResult> {
  const userId = await requireSessionUserId();
  const admin = createAdminClient();
  await admin.rpc("revoke_other_user_sessions", { p_user_id: userId });
  await admin.from("authjs_sessions").delete().eq("userId", userId);
  await rotateDatabaseSession(userId);
  return { success: true };
}

export async function uploadAvatarAction(
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireSessionUserId();
  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) return { success: false, error: "Avatar file required" };

  const admin = createAdminClient();
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error: uploadError } = await admin.storage
    .from("user-avatars")
    .upload(path, file, { upsert: true });
  if (uploadError) return { success: false, error: uploadError.message };

  const { data: pub } = admin.storage.from("user-avatars").getPublicUrl(path);
  const { error } = await admin
    .from("profiles")
    .update({ avatar_url: pub.publicUrl })
    .eq("id", userId);
  if (error) return { success: false, error: error.message };
  await admin
    .from("authjs_users")
    .update({ image: pub.publicUrl, updated_at: new Date().toISOString() })
    .eq("id", userId);
  return { success: true };
}

export async function verifyEmailTokenAction(
  email: string,
  token: string,
): Promise<ActionResult> {
  const normalized = email.toLowerCase().trim();
  const consumed = await consumeToken(`verify:${normalized}`, token);
  if (!consumed) return { success: false, error: "Verification link expired or invalid" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("authjs_users")
    .update({
      emailVerified: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("email", normalized);
  if (error) return { success: false, error: error.message };
  return { success: true, redirectTo: "/dashboard" };
}
