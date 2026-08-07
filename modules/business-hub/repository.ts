import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Business,
  BusinessMembership,
  BusinessWithMembership,
} from "./types";
import type { BusinessMemberRole } from "@/domains";

function db() {
  return createAdminClient();
}

export async function getBusinessById(id: string): Promise<Business | null> {
  const { data, error } = await db()
    .from("businesses")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) return null;
  return data as Business;
}

export async function getBusinessesForOwner(
  ownerUserId: string,
): Promise<Business[]> {
  const { data, error } = await db()
    .from("businesses")
    .select("*")
    .eq("owner_user_id", ownerUserId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []) as Business[];
}

export async function getBusinessesForUser(
  userId: string,
): Promise<BusinessWithMembership[]> {
  const { data: memberships, error } = await db()
    .from("business_memberships")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active");
  if (error || !memberships?.length) return [];

  const ids = memberships.map((m) => (m as BusinessMembership).business_id);
  const { data: businesses } = await db()
    .from("businesses")
    .select("*")
    .in("id", ids)
    .is("deleted_at", null);

  const byId = new Map(
    ((businesses ?? []) as Business[]).map((b) => [b.id, b]),
  );

  return memberships
    .map((raw) => {
      const membership = raw as BusinessMembership;
      const business = byId.get(membership.business_id);
      if (!business) return null;
      return { ...business, membership };
    })
    .filter(Boolean) as BusinessWithMembership[];
}

export async function getMembership(
  businessId: string,
  userId: string,
): Promise<BusinessMembership | null> {
  const { data } = await db()
    .from("business_memberships")
    .select("*")
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  return (data as BusinessMembership | null) ?? null;
}

export async function getBusinessByStoreId(
  storeId: string,
): Promise<Business | null> {
  const { data: store } = await db()
    .from("stores")
    .select("business_id")
    .eq("id", storeId)
    .maybeSingle();
  const businessId = (store as { business_id?: string | null } | null)
    ?.business_id;
  if (!businessId) return null;
  return getBusinessById(businessId);
}

export async function createBusinessRecord(input: {
  ownerUserId: string;
  legalName: string;
  displayName: string;
  slug: string;
  businessType?: string | null;
  logoUrl?: string | null;
  primaryStoreId?: string | null;
  status?: Business["status"];
  metadata?: Record<string, unknown>;
}): Promise<Business> {
  const { data, error } = await db()
    .from("businesses")
    .insert({
      owner_user_id: input.ownerUserId,
      legal_name: input.legalName,
      display_name: input.displayName,
      slug: input.slug,
      business_type: input.businessType ?? null,
      logo_url: input.logoUrl ?? null,
      primary_store_id: input.primaryStoreId ?? null,
      status: input.status ?? "pending",
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create business");
  return data as Business;
}

export async function updateBusinessRecord(
  id: string,
  patch: Partial<{
    legal_name: string;
    display_name: string;
    business_type: string | null;
    logo_url: string | null;
    profile: Record<string, unknown>;
    settings: Record<string, unknown>;
    metadata: Record<string, unknown>;
    status: Business["status"];
    verification_state: Business["verification_state"];
    primary_store_id: string | null;
  }>,
): Promise<Business> {
  const { data, error } = await db()
    .from("businesses")
    .update(patch)
    .eq("id", id)
    .is("deleted_at", null)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to update business");
  return data as Business;
}

export async function upsertMembership(input: {
  businessId: string;
  userId: string;
  role: BusinessMemberRole;
  invitedBy?: string | null;
}): Promise<BusinessMembership> {
  const { data, error } = await db()
    .from("business_memberships")
    .upsert(
      {
        business_id: input.businessId,
        user_id: input.userId,
        role: input.role,
        status: "active",
        invited_by: input.invitedBy ?? null,
        revoked_at: null,
      },
      { onConflict: "business_id,user_id" },
    )
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to upsert membership");
  return data as BusinessMembership;
}

export async function revokeMembership(
  businessId: string,
  userId: string,
): Promise<BusinessMembership> {
  const { data, error } = await db()
    .from("business_memberships")
    .update({
      status: "revoked",
      revoked_at: new Date().toISOString(),
    })
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to revoke membership");
  return data as BusinessMembership;
}

export async function linkStoreToBusiness(
  storeId: string,
  businessId: string,
): Promise<void> {
  const { error } = await db()
    .from("stores")
    .update({ business_id: businessId })
    .eq("id", storeId);
  if (error) throw new Error(error.message);

  await db()
    .from("products")
    .update({ business_id: businessId })
    .eq("store_id", storeId)
    .is("business_id", null);
}

export async function resolveUniqueBusinessSlug(base: string): Promise<string> {
  const slug =
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "business";
  let n = 0;
  while (true) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const { data } = await db()
      .from("businesses")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
    n += 1;
  }
}

export async function getActiveBusinesses(input: {
  limit?: number;
  offset?: number;
}): Promise<Business[]> {
  let query = db()
    .from("businesses")
    .select("*")
    .is("deleted_at", null)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (input.limit) {
    query = query.limit(input.limit);
  }

  if (input.offset) {
    query = query.range(input.offset, input.offset + (input.limit ?? 20) - 1);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as Business[]) ?? [];
}

export type BusinessMemberWithProfile = {
  id: string;
  business_id: string;
  user_id: string;
  role: BusinessMemberRole;
  status: string;
  display_name: string;
  avatar_url: string | null;
  headline: string | null;
  network_slug: string | null;
  network_profile_id: string | null;
};

export async function listBusinessMembers(
  businessId: string,
): Promise<BusinessMemberWithProfile[]> {
  const { data: memberships, error } = await db()
    .from("business_memberships")
    .select("*")
    .eq("business_id", businessId)
    .eq("status", "active")
    .order("created_at", { ascending: true });
  if (error || !memberships?.length) return [];

  const userIds = (memberships as BusinessMembership[]).map((m) => m.user_id);

  const [{ data: profiles }, { data: personProfiles }] = await Promise.all([
    db().from("profiles").select("id, full_name, avatar_url").in("id", userIds),
    db()
      .from("atlas_network_person_profiles")
      .select("user_id, network_profile_id")
      .in("user_id", userIds),
  ]);

  const profileMap = new Map(
    ((profiles ?? []) as Array<{ id: string; full_name: string | null; avatar_url: string | null }>).map(
      (p) => [p.id, p],
    ),
  );
  const personMap = new Map(
    ((personProfiles ?? []) as Array<{ user_id: string; network_profile_id: string }>).map(
      (p) => [p.user_id, p.network_profile_id],
    ),
  );

  const networkProfileIds = [...personMap.values()].filter(Boolean);
  let networkMap = new Map<string, { slug: string; headline: string | null; avatar_url: string | null; display_name: string }>();
  if (networkProfileIds.length > 0) {
    const { data: networkProfiles } = await db()
      .from("atlas_network_profiles")
      .select("id, slug, headline, avatar_url, display_name")
      .in("id", networkProfileIds);
    networkMap = new Map(
      ((networkProfiles ?? []) as Array<{ id: string; slug: string; headline: string | null; avatar_url: string | null; display_name: string }>).map(
        (p) => [p.id, p],
      ),
    );
  }

  return (memberships as BusinessMembership[]).map((m) => {
    const userProfile = profileMap.get(m.user_id);
    const networkProfileId = personMap.get(m.user_id) ?? null;
    const networkProfile = networkProfileId ? networkMap.get(networkProfileId) : null;
    return {
      id: m.id,
      business_id: m.business_id,
      user_id: m.user_id,
      role: m.role,
      status: m.status,
      display_name: networkProfile?.display_name ?? userProfile?.full_name ?? "Team member",
      avatar_url: networkProfile?.avatar_url ?? userProfile?.avatar_url ?? null,
      headline: networkProfile?.headline ?? null,
      network_slug: networkProfile?.slug ?? null,
      network_profile_id: networkProfileId,
    };
  });
}

export async function countBusinessProducts(businessId: string): Promise<number> {
  const { count } = await db()
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("is_active", true);
  return count ?? 0;
}

export async function countBusinessOrders(businessId: string): Promise<number> {
  const { data: stores } = await db()
    .from("stores")
    .select("id")
    .eq("business_id", businessId);
  const storeIds = ((stores ?? []) as Array<{ id: string }>).map((s) => s.id);
  if (storeIds.length === 0) return 0;
  const { count } = await db()
    .from("orders")
    .select("*", { count: "exact", head: true })
    .in("store_id", storeIds);
  return count ?? 0;
}

export async function countBusinessAnalyticsViews(businessId: string): Promise<number> {
  const { data } = await db()
    .from("atlas_core_analytics_facts")
    .select("metric_value")
    .eq("business_id", businessId)
    .in("metric_key", ["view", "page_view", "profile_view"]);
  if (!data?.length) return 0;
  return (data as Array<{ metric_value: number }>).reduce(
    (sum, row) => sum + Number(row.metric_value ?? 0),
    0,
  );
}
