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
} from "./validators";
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
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { success: false, error: error.message };
  }

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

  return { success: true, redirectTo: getDashboardPath(role) };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
