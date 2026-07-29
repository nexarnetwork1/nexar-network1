import { createClient } from "@/lib/supabase/server";

export type BrandRecord = {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  status: "pending" | "approved" | "rejected";
  approved_at: string | null;
};

export async function listApprovedBrands(limit = 50): Promise<BrandRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brands")
    .select("id, store_id, name, slug, logo_url, status, approved_at")
    .eq("status", "approved")
    .order("approved_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as BrandRecord[];
}

export async function approveBrand(brandId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("approve_brand", { p_brand_id: brandId });
  if (error) return { success: false, error: error.message };
  const result = data as { success?: boolean; error?: string };
  return { success: Boolean(result.success), error: result.error };
}
