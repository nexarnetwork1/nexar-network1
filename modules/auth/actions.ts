"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDashboardPath } from "@/lib/auth/redirect";
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
import { enforceSingleSession, trackUserSession, revokeCurrentSessionsOnLogout } from "./session";
import { setRememberMePreference } from "@/lib/auth/remember-me";
import type { UserRole } from "@/types";

export type ActionResult = {
  success: boolean;
  error?: string;
  redirectTo?: string;
  needsEmailConfirmation?: boolean;
};

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const rememberMe = formData.get("rememberMe") === "true";

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    await writeSecurityLog({
      eventType: "failed_login",
      metadata: { email: parsed.data.email, message: error.message },
    }).catch(() => undefined);
    return { success: false, error: error.message };
  }

  if (!data.user.email_confirmed_at) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Please confirm your email before signing in.",
      needsEmailConfirmation: true,
    };
  }

  await enforceSingleSession(data.user.id);
  await trackUserSession(data.user.id).catch(() => undefined);
  await setRememberMePreference(rememberMe);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, profile_completed")
    .eq("id", data.user.id)
    .single();

  if (profile && !profile.profile_completed) {
    return { success: true, redirectTo: "/auth/complete-profile" };
  }

  const redirectParam = formData.get("redirect") as string | null;
  const redirectTo =
    redirectParam && redirectParam.startsWith("/")
      ? redirectParam
      : getDashboardPath(profile?.role);

  return { success: true, redirectTo };
}

export async function registerCustomerAction(
  formData: FormData
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

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data.user) {
    return { success: false, error: "Registration failed" };
  }

  if (!data.session) {
    return {
      success: true,
      needsEmailConfirmation: true,
      redirectTo: "/login?message=confirm_email",
    };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      wallet_address: parsed.data.walletAddress.toLowerCase(),
      role: "customer",
      profile_completed: true,
    })
    .eq("id", data.user.id);

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  await writeAuditLog({
    actorId: data.user.id,
    actorRole: "customer",
    action: "auth.register",
    entityType: "profile",
    entityId: data.user.id,
    metadata: { method: "email", role: "customer" },
  }).catch(() => undefined);

  return { success: true, redirectTo: "/customer" };
}

export async function registerMerchantAction(
  formData: FormData
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

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.merchantName },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data.user) {
    return { success: false, error: "Registration failed" };
  }

  if (!data.session) {
    return {
      success: true,
      needsEmailConfirmation: true,
      redirectTo: "/login?message=confirm_email",
    };
  }

  let logoUrl: string | null = null;
  const logoFile = formData.get("logo") as File | null;
  if (logoFile && logoFile.size > 0) {
    const ext = logoFile.name.split(".").pop() ?? "png";
    const filePath = `${data.user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("store-logos")
      .upload(filePath, logoFile, { upsert: true });

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("store-logos")
        .getPublicUrl(filePath);
      logoUrl = urlData.publicUrl;
    }
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.merchantName,
      wallet_address: parsed.data.walletAddress.toLowerCase(),
      role: "merchant",
      profile_completed: true,
    })
    .eq("id", data.user.id);

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  try {
    const admin = createAdminClient();
    await admin.auth.admin.updateUserById(data.user.id, {
      app_metadata: { role: "merchant" },
    });
  } catch {
    // Service role key not configured in dev — profile.role is source of truth
  }

  const slug = parsed.data.storeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { error: storeError } = await supabase.from("stores").insert({
    owner_id: data.user.id,
    name: parsed.data.storeName,
    slug: slug || `store-${data.user.id.slice(0, 8)}`,
    business_type: parsed.data.businessType,
    logo_url: logoUrl,
    mode: parsed.data.mode,
    status: "pending",
    wallet_address: parsed.data.walletAddress.toLowerCase(),
  });

  if (storeError) {
    return { success: false, error: storeError.message };
  }

  await writeAuditLog({
    actorId: data.user.id,
    actorRole: "merchant",
    action: "auth.register",
    entityType: "profile",
    entityId: data.user.id,
    metadata: { method: "email", role: "merchant", store_name: parsed.data.storeName },
  }).catch(() => undefined);

  return { success: true, redirectTo: "/merchant" };
}

export async function completeProfileAction(
  formData: FormData
): Promise<ActionResult> {
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const role: UserRole = parsed.data.role ?? "customer";

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      wallet_address: parsed.data.walletAddress.toLowerCase(),
      role,
      profile_completed: true,
    })
    .eq("id", user.id);

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  if (role === "merchant" && parsed.data.storeName && parsed.data.businessType && parsed.data.mode) {
    try {
      const admin = createAdminClient();
      await admin.auth.admin.updateUserById(user.id, {
        app_metadata: { role: "merchant" },
      });
    } catch {
      // Service role key not configured in dev
    }

    const slug = parsed.data.storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const { error: storeError } = await supabase.from("stores").insert({
      owner_id: user.id,
      name: parsed.data.storeName,
      slug: slug || `store-${user.id.slice(0, 8)}`,
      business_type: parsed.data.businessType,
      mode: parsed.data.mode,
      status: "pending",
      wallet_address: parsed.data.walletAddress.toLowerCase(),
    });

    if (storeError) {
      return { success: false, error: storeError.message };
    }
  }

  await writeAuditLog({
    actorId: user.id,
    actorRole: role,
    action: "auth.profile_completed",
    entityType: "profile",
    entityId: user.id,
    metadata: { role },
  }).catch(() => undefined);

  return { success: true, redirectTo: getDashboardPath(role) };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    await revokeCurrentSessionsOnLogout(user.id).catch(() => undefined);

    await writeAuditLog({
      actorId: user.id,
      actorRole: profile?.role ?? "customer",
      action: "auth.logout",
      entityType: "profile",
      entityId: user.id,
    }).catch(() => undefined);
  }

  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPasswordAction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function resetPasswordAction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "Invalid or expired reset link. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  await writeAuditLog({
    actorId: user.id,
    actorRole: "customer",
    action: "auth.password_reset",
    entityType: "profile",
    entityId: user.id,
  }).catch(() => undefined);

  return { success: true, redirectTo: "/login?message=password_reset" };
}

export async function changePasswordAction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return { success: false, error: "Not authenticated" };
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });

  if (verifyError) {
    return { success: false, error: "Current password is incorrect" };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  await writeAuditLog({
    actorId: user.id,
    actorRole: "customer",
    action: "auth.password_changed",
    entityType: "profile",
    entityId: user.id,
  }).catch(() => undefined);

  return { success: true };
}

export async function resendConfirmationAction(
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get("email");
  if (typeof email !== "string" || !email.includes("@")) {
    return { success: false, error: "Valid email required" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateProfileAction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = updateProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    singleSession:
      formData.get("singleSession") === "on" ||
      formData.get("singleSession") === "true",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      single_session_enabled: parsed.data.singleSession ?? false,
    })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  return { success: true };
}

export async function changeEmailAction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = changeEmailSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { success: false, error: "Not authenticated" };

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.password,
  });

  if (verifyError) {
    return { success: false, error: "Password is incorrect" };
  }

  const { error } = await supabase.auth.updateUser({
    email: parsed.data.email,
  });

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    redirectTo: "/login?message=confirm_email",
  };
}

export async function changeWalletAction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = changeWalletSchema.safeParse({
    walletAddress: formData.get("walletAddress"),
    confirmWalletAddress: formData.get("confirmWalletAddress"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { success: false, error: "Not authenticated" };

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.password,
  });

  if (verifyError) {
    return { success: false, error: "Password is incorrect" };
  }

  const wallet = parsed.data.walletAddress.toLowerCase();

  const { error } = await supabase
    .from("profiles")
    .update({ wallet_address: wallet })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  await writeAuditLog({
    actorId: user.id,
    actorRole: "customer",
    action: "profile.wallet_changed",
    entityType: "profile",
    entityId: user.id,
  }).catch(() => undefined);

  return { success: true };
}

export async function revokeSessionAction(
  sessionId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.rpc("revoke_user_session", {
    p_session_id: sessionId,
  });

  if (error) return { success: false, error: error.message };

  await writeAuditLog({
    actorId: user.id,
    actorRole: "customer",
    action: "auth.session_revoked",
    entityType: "user_session",
    entityId: sessionId,
  }).catch(() => undefined);

  return { success: true };
}

export async function revokeOtherSessionsAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.rpc("revoke_other_user_sessions");

  if (error) return { success: false, error: error.message };

  try {
    const admin = createAdminClient();
    await admin.auth.admin.signOut(user.id, "others");
  } catch {
    // Service role not configured in dev
  }

  await writeAuditLog({
    actorId: user.id,
    actorRole: "customer",
    action: "auth.sessions_revoked_all",
    entityType: "profile",
    entityId: user.id,
  }).catch(() => undefined);

  return { success: true };
}
