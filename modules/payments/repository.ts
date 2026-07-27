import { createClient } from "@/lib/supabase/server";
import { isStripeConfigured } from "@/lib/stripe/server";
import type { PaymentSession } from "@/types";

export type InvoicePaymentOptions = {
  acceptsCrypto: boolean;
  acceptsCard: boolean;
  stripeAvailable: boolean;
};

export async function getInvoicePaymentOptions(
  storeId: string
): Promise<InvoicePaymentOptions> {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("store_settings")
    .select("accepts_crypto, accepts_card")
    .eq("store_id", storeId)
    .maybeSingle();

  return {
    acceptsCrypto: settings?.accepts_crypto ?? true,
    acceptsCard: (settings?.accepts_card ?? false) && isStripeConfigured(),
    stripeAvailable: isStripeConfigured(),
  };
}

export async function getPaymentSession(
  sessionId: string
): Promise<PaymentSession | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

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
    .maybeSingle();

  if (error) return null;
  return data as PaymentSession;
}

export async function getSessionWithInvoice(sessionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_sessions")
    .select("*, invoice:invoices(*)")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) return null;
  return data;
}
