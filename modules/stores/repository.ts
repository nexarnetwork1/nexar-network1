import { createClient } from "@/lib/supabase/server";
import type { Store } from "@/types";

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
