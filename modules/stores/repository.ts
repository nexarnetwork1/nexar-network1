import { createAdminClient } from "@/lib/supabase/admin";
import type { Store, StoreSettings, QrCode } from "@/types";

export async function getMerchantStores(ownerId: string): Promise<Store[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data ?? []) as Store[];
}

export async function getMerchantStore(
  ownerId: string,
  storeId?: string
): Promise<Store | null> {
  const supabase = createAdminClient();
  let query = supabase.from("stores").select("*").eq("owner_id", ownerId);
  if (storeId) query = query.eq("id", storeId);
  const { data, error } = await query.limit(1).maybeSingle();

  if (error) return null;
  return data as Store | null;
}

export async function getStoreBySlug(slug: string): Promise<Store | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error) return null;
  return data as Store;
}

export async function getStoreById(storeId: string): Promise<Store | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", storeId)
    .maybeSingle();

  if (error) return null;
  return data as Store | null;
}

export async function getStoreSettings(
  storeId: string
): Promise<StoreSettings | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("store_settings")
    .select("*")
    .eq("store_id", storeId)
    .maybeSingle();

  if (error) return null;
  return data as StoreSettings | null;
}

export async function getStoreQrCodes(storeId: string): Promise<QrCode[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .order("qr_type");

  if (error) return [];
  return (data ?? []) as QrCode[];
}

export async function getStoreCustomers(storeId: string, limit = 100) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("customer_id, customer:profiles(id, full_name, email, created_at)")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];

  const seen = new Set<string>();
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.customer_id, (counts.get(row.customer_id) ?? 0) + 1);
  }

  const customers: Array<{
    id: string;
    full_name: string | null;
    email: string;
    created_at: string;
    order_count: number;
  }> = [];

  for (const row of data ?? []) {
    if (seen.has(row.customer_id)) continue;
    seen.add(row.customer_id);
    const c = row.customer as unknown as { id: string; full_name: string | null; email: string; created_at: string };
    customers.push({ ...c, order_count: counts.get(row.customer_id) ?? 0 });
  }

  return customers;
}
