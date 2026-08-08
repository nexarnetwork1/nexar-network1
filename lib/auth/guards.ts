import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile, UserRole } from "@/types";

export class AuthorizationError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function requireAuthenticatedProfile(
  roles?: UserRole[],
): Promise<Profile> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new AuthorizationError("Not authenticated");
  }

  const { data: profile, error } = await createAdminClient()
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    throw new AuthorizationError("Profile not found");
  }

  if (roles && !roles.includes(profile.role as UserRole)) {
    throw new AuthorizationError("Insufficient permissions");
  }

  return profile as Profile;
}

export async function requireStoreOwner(storeId: string): Promise<Profile> {
  const profile = await requireAuthenticatedProfile(["merchant", "business"]);
  const admin = createAdminClient();

  const { data: store } = await admin
    .from("stores")
    .select("id, owner_id, business_id")
    .eq("id", storeId)
    .maybeSingle();

  if (!store) {
    throw new AuthorizationError("Store access denied");
  }

  if (store.owner_id === profile.id) {
    return profile;
  }

  // Business Hub membership: allow owner/admin/manager of the parent business.
  if (store.business_id) {
    const { data: membership } = await admin
      .from("business_memberships")
      .select("role")
      .eq("business_id", store.business_id)
      .eq("user_id", profile.id)
      .eq("status", "active")
      .maybeSingle();
    if (
      membership &&
      ["owner", "admin", "manager"].includes(
        (membership as { role: string }).role,
      )
    ) {
      return profile;
    }
  }

  throw new AuthorizationError("Store access denied");
}

export async function requireOrderAccess(
  orderId: string,
  roles: UserRole[],
): Promise<{ profile: Profile; order: { customer_id: string; store_id: string } }> {
  const profile = await requireAuthenticatedProfile(roles);
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("customer_id, store_id")
    .eq("id", orderId)
    .single();

  if (!order) {
    throw new AuthorizationError("Order not found");
  }

  if (profile.role === "customer" && order.customer_id !== profile.id) {
    throw new AuthorizationError("Order access denied");
  }

  if (profile.role === "merchant" || profile.role === "business") {
    const { data: store } = await admin
      .from("stores")
      .select("id, owner_id, business_id")
      .eq("id", order.store_id)
      .maybeSingle();

    if (!store) {
      throw new AuthorizationError("Order access denied");
    }

    const isOwner = store.owner_id === profile.id;
    let isBusinessMember = false;
    if (!isOwner && store.business_id) {
      const { data: membership } = await admin
        .from("business_memberships")
        .select("role")
        .eq("business_id", store.business_id)
        .eq("user_id", profile.id)
        .eq("status", "active")
        .maybeSingle();
      isBusinessMember = Boolean(
        membership &&
          ["owner", "admin", "manager", "staff"].includes(
            (membership as { role: string }).role,
          ),
      );
    }

    if (!isOwner && !isBusinessMember) {
      throw new AuthorizationError("Order access denied");
    }
  }

  return { profile, order };
}

export async function requireInvoiceAccess(
  invoiceId: string,
): Promise<{
  profile: Profile;
  invoice: { id: string; customer_id: string; store_id: string; order_id: string | null };
}> {
  const profile = await requireAuthenticatedProfile([
    "customer",
    "merchant",
    "business",
    "admin",
    "super_admin",
    "platform_owner",
  ]);
  const admin = createAdminClient();

  const { data: invoice } = await admin
    .from("invoices")
    .select("id, customer_id, store_id, order_id")
    .eq("id", invoiceId)
    .maybeSingle();

  if (!invoice) {
    throw new AuthorizationError("Invoice not found");
  }

  const row = invoice as {
    id: string;
    customer_id: string;
    store_id: string;
    order_id: string | null;
  };

  if (profile.role === "customer" && row.customer_id !== profile.id) {
    throw new AuthorizationError("Invoice access denied");
  }

  if (profile.role === "merchant" || profile.role === "business") {
    const { data: store } = await admin
      .from("stores")
      .select("id, owner_id, business_id")
      .eq("id", row.store_id)
      .maybeSingle();

    if (!store) {
      throw new AuthorizationError("Invoice access denied");
    }

    const isOwner = store.owner_id === profile.id;
    let isBusinessMember = false;
    if (!isOwner && store.business_id) {
      const { data: membership } = await admin
        .from("business_memberships")
        .select("role")
        .eq("business_id", store.business_id)
        .eq("user_id", profile.id)
        .eq("status", "active")
        .maybeSingle();
      isBusinessMember = Boolean(
        membership &&
          ["owner", "admin", "manager", "staff"].includes(
            (membership as { role: string }).role,
          ),
      );
    }

    if (!isOwner && !isBusinessMember) {
      throw new AuthorizationError("Invoice access denied");
    }
  }

  if (
    profile.role === "admin" ||
    profile.role === "super_admin" ||
    profile.role === "platform_owner"
  ) {
    try {
      const { requireHqAccess } = await import("@/lib/hq/authorization");
      await requireHqAccess({ permission: "hq:access" });
    } catch {
      throw new AuthorizationError("Invoice access denied");
    }
  }

  return { profile, invoice: row };
}
