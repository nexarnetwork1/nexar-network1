import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types";

export class AuthorizationError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function requireAuthenticatedProfile(
  roles?: UserRole[]
): Promise<Profile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AuthorizationError("Not authenticated");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
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
  const profile = await requireAuthenticatedProfile(["merchant"]);

  const supabase = await createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .eq("owner_id", profile.id)
    .maybeSingle();

  if (!store) {
    throw new AuthorizationError("Store access denied");
  }

  return profile;
}

export async function requireOrderAccess(
  orderId: string,
  roles: UserRole[]
): Promise<{ profile: Profile; order: { customer_id: string; store_id: string } }> {
  const profile = await requireAuthenticatedProfile(roles);
  const supabase = await createClient();

  const { data: order } = await supabase
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

  if (profile.role === "merchant") {
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("id", order.store_id)
      .eq("owner_id", profile.id)
      .maybeSingle();

    if (!store) {
      throw new AuthorizationError("Order access denied");
    }
  }

  return { profile, order };
}
