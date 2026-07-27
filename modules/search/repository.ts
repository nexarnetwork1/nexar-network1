import { createClient } from "@/lib/supabase/server";
import type { SearchResult } from "@/types";

export async function globalSearch(query: string, limit = 20): Promise<SearchResult[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("global_search", {
    p_query: query.trim(),
    p_limit: limit,
  });
  if (error || !data) return [];
  const parsed = data as { results?: SearchResult[] };
  return parsed.results ?? [];
}
