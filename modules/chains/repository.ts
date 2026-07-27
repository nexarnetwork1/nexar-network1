import { createAdminClient } from "@/lib/supabase/admin";
import { chainsConfig } from "@/config/chains";
import type { SupportedChain } from "@/types";

export async function getSupportedChains(activeOnly = true): Promise<SupportedChain[]> {
  const admin = createAdminClient();
  let query = admin.from("supported_chains").select("*").order("chain_id");
  if (activeOnly) query = query.eq("is_active", true);
  const { data } = await query;
  return (data ?? []) as SupportedChain[];
}

export function getDefaultChainId(): number {
  return chainsConfig.defaultChainId;
}

export function isChainActive(chainId: number): boolean {
  return chainsConfig.supported.some((c) => c.chainId === chainId && c.active);
}
