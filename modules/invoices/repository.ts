import { createClient } from "@/lib/supabase/server";
import type { Invoice, InvoiceWithDetails } from "@/types";

export async function getCustomerInvoices(customerId: string): Promise<Invoice[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("customer_id", customerId)
    .order("issued_at", { ascending: false });

  if (error) return [];
  return data as Invoice[];
}

export async function getMerchantInvoices(storeId: string): Promise<Invoice[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("store_id", storeId)
    .order("issued_at", { ascending: false });

  if (error) return [];
  return data as Invoice[];
}

export async function getAllInvoices(): Promise<Invoice[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .order("issued_at", { ascending: false })
    .limit(100);

  if (error) return [];
  return data as Invoice[];
}

export async function getInvoiceById(invoiceId: string): Promise<InvoiceWithDetails | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "*, order:orders(*), store:stores(id, name, slug), customer:profiles!customer_id(id, full_name, email)"
    )
    .eq("id", invoiceId)
    .single();

  if (error) return null;
  return data as InvoiceWithDetails;
}

export async function getInvoiceByOrderId(orderId: string): Promise<Invoice | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("order_id", orderId)
    .single();

  if (error) return null;
  return data as Invoice;
}
