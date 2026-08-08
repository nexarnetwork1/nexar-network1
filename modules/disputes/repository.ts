import { createAdminClient } from "@/lib/supabase/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Dispute, DisputeEvidence, DisputeMessage, DisputeStatus } from "@/types";

export async function getDisputeById(disputeId: string): Promise<Dispute | null> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("disputes").select("*").eq("id", disputeId).maybeSingle();
  return (data as Dispute) ?? null;
}

export async function getCustomerDisputes(customerId: string): Promise<Dispute[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("disputes")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Dispute[];
}

export async function getStoreDisputes(storeId: string): Promise<Dispute[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("disputes")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Dispute[];
}

export async function getAllDisputes(status?: DisputeStatus): Promise<Dispute[]> {
  const admin = createAdminClient();
  let query = admin.from("disputes").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data } = await query.limit(200);
  return (data ?? []) as Dispute[];
}

export async function openDispute(
  orderId: string,
  customerId: string,
  reason: string
): Promise<{ disputeId?: string; error?: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("open_dispute", {
    p_order_id: orderId,
    p_customer_id: customerId,
    p_reason: reason,
  });
  if (error) return { error: error.message };
  return { disputeId: data as string };
}

export async function getDisputeMessages(disputeId: string): Promise<DisputeMessage[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("dispute_messages")
    .select("*")
    .eq("dispute_id", disputeId)
    .order("created_at", { ascending: true });
  return (data ?? []) as DisputeMessage[];
}

export async function addDisputeMessage(params: {
  disputeId: string;
  senderId: string;
  senderRole: DisputeMessage["sender_role"];
  message: string;
}): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("dispute_messages").insert({
    dispute_id: params.disputeId,
    sender_id: params.senderId,
    sender_role: params.senderRole,
    message: params.message,
  });
  return !error;
}

export async function addDisputeEvidence(params: {
  disputeId: string;
  uploadedBy: string;
  fileUrl: string;
  fileType?: string;
  description?: string;
}): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("dispute_evidence").insert({
    dispute_id: params.disputeId,
    uploaded_by: params.uploadedBy,
    file_url: params.fileUrl,
    file_type: params.fileType ?? null,
    description: params.description ?? null,
  });
  return !error;
}

export async function getDisputeEvidence(disputeId: string): Promise<DisputeEvidence[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("dispute_evidence")
    .select("*")
    .eq("dispute_id", disputeId)
    .order("created_at", { ascending: false });
  return (data ?? []) as DisputeEvidence[];
}

export async function updateDisputeStatus(
  disputeId: string,
  status: DisputeStatus,
  updates: Partial<Pick<Dispute, "resolution" | "refund_amount" | "resolved_by" | "resolved_at">> = {}
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("disputes")
    .update({ status, ...updates, updated_at: new Date().toISOString() })
    .eq("id", disputeId);
  return !error;
}
