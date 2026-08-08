import { createAdminClient } from "@/lib/supabase/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Escrow, EscrowStatus } from "@/types";

export async function getEscrowByOrderId(orderId: string): Promise<Escrow | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("escrows")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();
  return (data as Escrow) ?? null;
}

export async function getStoreEscrows(storeId: string, status?: EscrowStatus): Promise<Escrow[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("escrows")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data } = await query.limit(100);
  return (data ?? []) as Escrow[];
}

export async function getHeldEscrowBalance(storeId: string): Promise<number> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("escrows")
    .select("amount")
    .eq("store_id", storeId)
    .eq("status", "held");
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
}

export async function releaseEscrow(
  escrowId: string,
  actorId: string,
  reason = "manual_release"
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("release_escrow", {
    p_escrow_id: escrowId,
    p_actor_id: actorId,
    p_reason: reason,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function refundEscrow(
  escrowId: string,
  actorId: string,
  reason = "refund"
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  const { error } = await admin.rpc("refund_escrow", {
    p_escrow_id: escrowId,
    p_actor_id: actorId,
    p_reason: reason,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getEscrowEvents(escrowId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("escrow_events")
    .select("*")
    .eq("escrow_id", escrowId)
    .order("created_at", { ascending: true });
  return data ?? [];
}
