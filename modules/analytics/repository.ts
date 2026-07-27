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
};

export async function getPlatformStats(): Promise<PlatformStats> {
  const admin = createAdminClient();

  const [
    profiles,
    stores,
    orders,
    settlements,
    payments,
  ] = await Promise.all([
    admin.from("profiles").select("role", { count: "exact", head: false }),
    admin.from("stores").select("status"),
    admin.from("orders").select("status, subtotal, platform_fee"),
    admin.from("settlements").select("platform_fee, status"),
    admin.from("payment_sessions").select("status"),
  ]);

  const profileData = profiles.data ?? [];
  const storeData = stores.data ?? [];
  const orderData = orders.data ?? [];
  const settlementData = settlements.data ?? [];
  const paymentData = payments.data ?? [];

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
  };
}
