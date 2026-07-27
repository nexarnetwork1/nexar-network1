import { createClient } from "@/lib/supabase/server";
import type { PaymentSession } from "@/types";

export async function getPaymentSession(sessionId: string): Promise<PaymentSession | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error) return null;
  return data as PaymentSession;
}

export async function getPaymentSessionByInvoice(
  invoiceId: string
): Promise<PaymentSession | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_sessions")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data as PaymentSession;
}

export async function getSessionWithInvoice(sessionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_sessions")
    .select("*, invoice:invoices(*), order:orders(*, store:stores(name))")
    .eq("id", sessionId)
    .single();

  if (error) return null;
  return data;
}
