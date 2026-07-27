"use client";

import { useRouter } from "next/navigation";
import { useRealtimeSubscription } from "./useRealtimeSubscription";

export function useRealtimeOrders(storeId?: string) {
  const router = useRouter();

  useRealtimeSubscription(`orders:${storeId ?? "all"}`, {
    table: "orders",
    filter: storeId ? `store_id=eq.${storeId}` : undefined,
    event: "*",
    onChange: () => router.refresh(),
  });
}

export function useRealtimePayments(sessionId?: string) {
  const router = useRouter();

  useRealtimeSubscription(`payments:${sessionId ?? "all"}`, {
    table: "payment_sessions",
    filter: sessionId ? `id=eq.${sessionId}` : undefined,
    event: "UPDATE",
    onChange: () => router.refresh(),
  });
}

export function useRealtimeInvoices(storeId?: string) {
  const router = useRouter();

  useRealtimeSubscription(`invoices:${storeId ?? "all"}`, {
    table: "invoices",
    filter: storeId ? `store_id=eq.${storeId}` : undefined,
    event: "*",
    onChange: () => router.refresh(),
  });
}

/** Customer-scoped realtime — refreshes when the customer's orders change. */
export function useRealtimeCustomerOrders(customerId?: string) {
  const router = useRouter();

  useRealtimeSubscription(`customer-orders:${customerId ?? "none"}`, {
    table: "orders",
    filter: customerId ? `customer_id=eq.${customerId}` : undefined,
    event: "*",
    onChange: () => router.refresh(),
  });
}

/** Customer-scoped realtime — refreshes when the customer's invoices change. */
export function useRealtimeCustomerInvoices(customerId?: string) {
  const router = useRouter();

  useRealtimeSubscription(`customer-invoices:${customerId ?? "none"}`, {
    table: "invoices",
    filter: customerId ? `customer_id=eq.${customerId}` : undefined,
    event: "*",
    onChange: () => router.refresh(),
  });
}

/** Customer-scoped realtime — refreshes when the customer's disputes change. */
export function useRealtimeCustomerDisputes(customerId?: string) {
  const router = useRouter();

  useRealtimeSubscription(`customer-disputes:${customerId ?? "none"}`, {
    table: "disputes",
    filter: customerId ? `customer_id=eq.${customerId}` : undefined,
    event: "*",
    onChange: () => router.refresh(),
  });
}
