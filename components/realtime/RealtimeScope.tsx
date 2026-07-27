"use client";

import { useRealtimeOrders, useRealtimePayments, useRealtimeInvoices, useRealtimeCustomerOrders, useRealtimeCustomerInvoices, useRealtimeCustomerDisputes } from "@/hooks/useRealtimeOrders";
import { useRealtimeWallet, useRealtimeDashboard } from "@/hooks/useRealtimeWallet";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

type RealtimeScopeProps = {
  userId: string;
  storeId?: string;
  customerId?: string;
  walletId?: string;
  paymentSessionId?: string;
  initialUnreadCount?: number;
};

/** Composes all realtime subscriptions for a dashboard context — no page refresh needed. */
export function RealtimeScope({
  userId,
  storeId,
  customerId,
  walletId,
  paymentSessionId,
  initialUnreadCount = 0,
}: RealtimeScopeProps) {
  useRealtimeNotifications(userId, initialUnreadCount);
  useRealtimeCustomerOrders(customerId);
  useRealtimeCustomerInvoices(customerId);
  useRealtimeCustomerDisputes(customerId);
  useRealtimeOrders(customerId ? undefined : storeId);
  useRealtimeInvoices(customerId ? undefined : storeId);
  useRealtimeDashboard(customerId ? undefined : storeId);
  useRealtimePayments(paymentSessionId);
  useRealtimeWallet(walletId);
  return null;
}
