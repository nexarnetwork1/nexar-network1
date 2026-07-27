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
  failedPayments: number;
  pendingPayments: number;
  newContactMessages: number;
};

export type DashboardOverview = {
  todayRevenue: number;
  monthlyRevenue: number;
  platformFeeRevenue: number;
  todayOrders: number;
  todayPayments: number;
  activeMerchants: number;
  activeCustomers: number;
  pendingPayments: number;
  failedPayments: number;
};

export type LatestTransaction = {
  id: string;
  type: "payment" | "settlement";
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  reference?: string;
};

export type TopMerchant = {
  store_id: string;
  store_name: string;
  order_count: number;
  revenue: number;
};

export type TopProduct = {
  product_id: string;
  product_name: string;
  store_name: string;
  units_sold: number;
  revenue: number;
};

export type GrowthPoint = {
  month: string;
  merchants: number;
  customers: number;
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
    failedPayments: paymentData.filter((p) => p.status === "failed").length,
    pendingPayments: paymentData.filter((p) =>
      ["waiting", "pending", "waiting_confirmation"].includes(p.status)
    ).length,
    newContactMessages: contactData.filter((c) => c.status === "new").length,
  };
}

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfMonth(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const admin = createAdminClient();
  const today = startOfToday();
  const monthStart = startOfMonth();

  const [orders, payments, profiles, stores, settlements] = await Promise.all([
    admin.from("orders").select("status, subtotal, paid_at, created_at"),
    admin.from("payment_sessions").select("status, amount_usd, paid_at, created_at"),
    admin.from("profiles").select("role, created_at"),
    admin.from("stores").select("status, owner_id"),
    admin.from("settlements").select("platform_fee, status, created_at"),
  ]);

  const orderData = orders.data ?? [];
  const paymentData = payments.data ?? [];
  const profileData = profiles.data ?? [];
  const storeData = stores.data ?? [];
  const settlementData = settlements.data ?? [];

  const paidToday = orderData.filter(
    (o) => o.status === "paid" && (o.paid_at ?? o.created_at) >= today
  );
  const paidMonth = orderData.filter(
    (o) => o.status === "paid" && (o.paid_at ?? o.created_at) >= monthStart
  );

  return {
    todayRevenue: paidToday.reduce((s, o) => s + Number(o.subtotal), 0),
    monthlyRevenue: paidMonth.reduce((s, o) => s + Number(o.subtotal), 0),
    platformFeeRevenue: settlementData
      .filter((s) => s.status === "completed")
      .reduce((s, r) => s + Number(r.platform_fee), 0),
    todayOrders: orderData.filter((o) => o.created_at >= today).length,
    todayPayments: paymentData.filter((p) => p.created_at >= today).length,
    activeMerchants: storeData.filter((s) => s.status === "active").length,
    activeCustomers: profileData.filter((p) => p.role === "customer").length,
    pendingPayments: paymentData.filter((p) =>
      ["waiting", "pending", "waiting_confirmation"].includes(p.status)
    ).length,
    failedPayments: paymentData.filter((p) => p.status === "failed").length,
  };
}

export async function getLatestTransactions(limit = 10): Promise<LatestTransaction[]> {
  const admin = createAdminClient();

  const [{ data: sessions }, { data: settlements }] = await Promise.all([
    admin
      .from("payment_sessions")
      .select("id, amount_usd, currency, status, created_at, invoice:invoices(invoice_number)")
      .order("created_at", { ascending: false })
      .limit(limit),
    admin
      .from("settlements")
      .select("id, gross_amount, currency, status, created_at, order_id")
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const items: LatestTransaction[] = [
    ...(sessions ?? []).map((s) => ({
      id: s.id,
      type: "payment" as const,
      amount: Number(s.amount_usd),
      currency: s.currency,
      status: s.status,
      created_at: s.created_at,
      reference: (s.invoice as { invoice_number?: string })?.invoice_number,
    })),
    ...(settlements ?? []).map((s) => ({
      id: s.id,
      type: "settlement" as const,
      amount: Number(s.gross_amount),
      currency: s.currency,
      status: s.status,
      created_at: s.created_at,
      reference: s.order_id,
    })),
  ];

  return items
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

export async function getTopMerchants(limit = 5): Promise<TopMerchant[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select("store_id, subtotal, status, store:stores(id, name)")
    .eq("status", "paid");

  const map = new Map<string, TopMerchant>();
  for (const o of data ?? []) {
    const store = o.store as { id?: string; name?: string } | null;
    if (!store?.id) continue;
    const existing = map.get(store.id) ?? {
      store_id: store.id,
      store_name: store.name ?? "Unknown",
      order_count: 0,
      revenue: 0,
    };
    existing.order_count += 1;
    existing.revenue += Number(o.subtotal);
    map.set(store.id, existing);
  }

  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export async function getTopProducts(limit = 5): Promise<TopProduct[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("order_items")
    .select("product_id, product_name, quantity, line_total, order:orders!inner(status, store:stores(name))")
    .eq("order.status", "paid");

  const map = new Map<string, TopProduct>();
  for (const item of data ?? []) {
    if (!item.product_id) continue;
    const storeName = (item.order as { store?: { name?: string } })?.store?.name ?? "—";
    const existing = map.get(item.product_id) ?? {
      product_id: item.product_id,
      product_name: item.product_name,
      store_name: storeName,
      units_sold: 0,
      revenue: 0,
    };
    existing.units_sold += item.quantity;
    existing.revenue += Number(item.line_total);
    map.set(item.product_id, existing);
  }

  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export async function getGrowthStats(months = 6): Promise<GrowthPoint[]> {
  const admin = createAdminClient();
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const { data: profiles } = await admin
    .from("profiles")
    .select("role, created_at")
    .gte("created_at", since.toISOString());

  const buckets = new Map<string, GrowthPoint>();

  for (const p of profiles ?? []) {
    const d = new Date(p.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const existing = buckets.get(key) ?? { month: key, merchants: 0, customers: 0 };
    if (p.role === "merchant") existing.merchants += 1;
    if (p.role === "customer") existing.customers += 1;
    buckets.set(key, existing);
  }

  return Array.from(buckets.values()).sort((a, b) => a.month.localeCompare(b.month));
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
