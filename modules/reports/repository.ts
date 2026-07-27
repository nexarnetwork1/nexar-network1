import { createAdminClient } from "@/lib/supabase/admin";
import type { ContentReport } from "@/types";

export async function getPendingReports(limit = 50): Promise<ContentReport[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("content_reports")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as ContentReport[];
}

export async function getAllReports(limit = 100): Promise<ContentReport[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("content_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as ContentReport[];
}
