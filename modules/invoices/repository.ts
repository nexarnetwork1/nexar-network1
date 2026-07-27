import { createClient } from "@/lib/supabase/server";
import type { Invoice, InvoiceWithDetails, InvoiceItem } from "@/types";

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
  const invoice = data as InvoiceWithDetails;

  const { data: items } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("created_at");

  return { ...invoice, items: (items ?? []) as InvoiceWithDetails["items"] };
}

export async function getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("created_at");

  if (error) return [];
  return (data ?? []) as InvoiceItem[];
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
