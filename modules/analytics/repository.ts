import { createAdminClient } from "@/lib/supabase/admin";

export type PlatformStats = {
  totalUsers: number;
  totalMerchants: number;
  totalCustomers: number;
  totalStores: number;
  activeStores: number;
  pendingStores: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalPlatformFees: number;
  totalPayments: number;
  paidPayments: number;
  newContactMessages: number;
};

export type MonthlyRevenue = {
  month: string;
  revenue: number;
  fees: number;
  orders: number;
};

export async function getPlatformStats(): Promise<PlatformStats> {
  const admin = createAdminClient();

  const [profiles, stores, orders, settlements, payments, contacts] = await Promise.all([
    admin.from("profiles").select("role", { count: "exact", head: false }),
    admin.from("stores").select("status"),
    admin.from("orders").select("status, subtotal, platform_fee"),
    admin.from("settlements").select("platform_fee, status"),
    admin.from("payment_sessions").select("status"),
    admin.from("contact_messages").select("status"),
  ]);

  const profileData = profiles.data ?? [];
  const storeData = stores.data ?? [];
  const orderData = orders.data ?? [];
  const settlementData = settlements.data ?? [];
  const paymentData = payments.data ?? [];
  const contactData = contacts.data ?? [];

  return {
    totalUsers: profileData.length,
    totalMerchants: profileData.filter((p) => p.role === "merchant").length,
    totalCustomers: profileData.filter((p) => p.role === "customer").length,
    totalStores: storeData.length,
    activeStores: storeData.filter((s) => s.status === "active").length,
    pendingStores: storeData.filter((s) => s.status === "pending").length,
    totalOrders: orderData.length,
    paidOrders: orderData.filter((o) => o.status === "paid").length,
    pendingOrders: orderData.filter((o) => o.status === "pending_payment").length,
    totalRevenue: orderData
      .filter((o) => o.status === "paid")
      .reduce((sum, o) => sum + Number(o.subtotal), 0),
    totalPlatformFees: settlementData
      .filter((s) => s.status === "completed")
      .reduce((sum, s) => sum + Number(s.platform_fee), 0),
    totalPayments: paymentData.length,
    paidPayments: paymentData.filter((p) => p.status === "paid").length,
    newContactMessages: contactData.filter((c) => c.status === "new").length,
  };
}

export async function getMonthlyRevenue(months = 6): Promise<MonthlyRevenue[]> {
  const admin = createAdminClient();
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const { data: orders } = await admin
    .from("orders")
    .select("subtotal, platform_fee, paid_at, created_at, status")
    .eq("status", "paid")
    .gte("paid_at", since.toISOString())
    .order("paid_at", { ascending: true });

  const buckets = new Map<string, MonthlyRevenue>();

  for (const order of orders ?? []) {
    const date = new Date(order.paid_at ?? order.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    const existing = buckets.get(key) ?? {
      month: key,
      revenue: 0,
      fees: 0,
      orders: 0,
    };

    existing.revenue += Number(order.subtotal);
    existing.fees += Number(order.platform_fee);
    existing.orders += 1;
    buckets.set(key, existing);
  }

  return Array.from(buckets.values()).sort((a, b) => a.month.localeCompare(b.month));
}
