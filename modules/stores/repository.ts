import { createClient } from "@/lib/supabase/server";
import type { Store, StoreSettings, QrCode } from "@/types";

export async function getMerchantStore(ownerId: string): Promise<Store | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", ownerId)
    .single();

  if (error) return null;
  return data as Store;
}

export async function getStoreBySlug(slug: string): Promise<Store | null> {
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_settings")
    .select("*")
    .eq("store_id", storeId)
    .maybeSingle();

  if (error) return null;
  return data as StoreSettings | null;
}

export async function getStoreQrCodes(storeId: string): Promise<QrCode[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .order("qr_type");

  if (error) return [];
  return (data ?? []) as QrCode[];
}
