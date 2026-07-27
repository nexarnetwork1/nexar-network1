import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem, OrderWithDetails } from "@/types";

export async function getCustomerOrders(customerId: string): Promise<OrderWithDetails[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, store:stores(id, name, slug), items:order_items(*), invoice:invoices(*)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as OrderWithDetails[];
}

export async function getMerchantOrders(storeId: string): Promise<OrderWithDetails[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, store:stores(id, name, slug), items:order_items(*), invoice:invoices(*)")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as OrderWithDetails[];
}

export async function getAllOrders(): Promise<OrderWithDetails[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, store:stores(id, name, slug), items:order_items(*), invoice:invoices(*)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return [];
  return (data ?? []) as OrderWithDetails[];
}

export async function getOrderById(orderId: string): Promise<OrderWithDetails | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, store:stores(id, name, slug), items:order_items(*), invoice:invoices(*)")
    .eq("id", orderId)
    .single();

  if (error) return null;
  return data as OrderWithDetails;
}

export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);

  if (error) return [];
  return data as OrderItem[];
}
