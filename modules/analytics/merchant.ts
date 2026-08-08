import { createAdminClient } from "@/lib/supabase/admin";
import { getMerchantOrders } from "@/modules/orders/repository";
import type { MerchantAnalytics } from "@/types";

export async function getMerchantAnalytics(storeId: string): Promise<MerchantAnalytics> {
  const supabase = createAdminClient();
  const orders = await getMerchantOrders(storeId);
  const paidOrders = orders.filter((o) => o.status === "paid");

  const [{ count: productCount }, { data: products }] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .eq("is_active", true),
    supabase.from("products").select("id, name").eq("store_id", storeId),
  ]);

  const customerIds = new Set(paidOrders.map((o) => o.customer_id));
  const revenue = paidOrders.reduce((s, o) => s + Number(o.subtotal), 0);

  const revenueByDay = paidOrders.reduce<Record<string, number>>((acc, order) => {
    const day = order.created_at.slice(0, 10);
    acc[day] = (acc[day] ?? 0) + Number(order.subtotal);
    return acc;
  }, {});

  const ordersByCurrency = paidOrders.reduce<Record<string, { count: number; revenue: number }>>(
    (acc, order) => {
      const cur = order.currency;
      if (!acc[cur]) acc[cur] = { count: 0, revenue: 0 };
      acc[cur].count += 1;
      acc[cur].revenue += Number(order.subtotal);
      return acc;
    },
    {}
  );

  const productSales = new Map<string, { units: number; revenue: number }>();
  for (const order of paidOrders) {
    for (const item of order.items) {
      if (!item.product_id) continue;
      const existing = productSales.get(item.product_id) ?? { units: 0, revenue: 0 };
      existing.units += item.quantity;
      existing.revenue += Number(item.line_total);
      productSales.set(item.product_id, existing);
    }
  }

  const productNameMap = new Map((products ?? []).map((p) => [p.id, p.name]));
  const topProducts = [...productSales.entries()]
    .map(([id, stats]) => ({
      id,
      name: productNameMap.get(id) ?? "Unknown",
      units: stats.units,
      revenue: stats.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const customerSpend = paidOrders.reduce<Record<string, { orders: number; spent: number }>>(
    (acc, order) => {
      const id = order.customer_id;
      if (!acc[id]) acc[id] = { orders: 0, spent: 0 };
      acc[id].orders += 1;
      acc[id].spent += Number(order.subtotal);
      return acc;
    },
    {}
  );

  const customerProfiles = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", Object.keys(customerSpend));

  const nameMap = new Map(
    (customerProfiles.data ?? []).map((p) => [p.id, p.full_name ?? "Customer"])
  );

  const bestCustomers = Object.entries(customerSpend)
    .map(([id, stats]) => ({
      id,
      name: nameMap.get(id) ?? "Customer",
      orders: stats.orders,
      spent: stats.spent,
    }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);

  const conversionRate =
    orders.length > 0 ? Number(((paidOrders.length / orders.length) * 100).toFixed(1)) : 0;

  return {
    revenue,
    orders: orders.length,
    customers: customerIds.size,
    products: productCount ?? 0,
    conversionRate,
    revenueByDay: Object.entries(revenueByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, rev]) => ({ date, revenue: rev })),
    ordersByCurrency: Object.entries(ordersByCurrency).map(([currency, stats]) => ({
      currency,
      ...stats,
    })),
    topProducts,
    bestCustomers,
    latestOrders: orders.slice(0, 5),
  };
}
