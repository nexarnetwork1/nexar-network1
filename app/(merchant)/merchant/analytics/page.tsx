import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getMerchantOrders } from "@/modules/orders/repository";
import { MerchantAnalyticsChart } from "@/components/merchant/MerchantAnalyticsChart";

export default async function MerchantAnalyticsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const store = await getMerchantStore(profile.id);
  if (!store) redirect("/merchant");

  const orders = await getMerchantOrders(store.id);

  const paidOrders = orders.filter((o) => o.status === "paid");
  const pendingOrders = orders.filter((o) => o.status === "pending_payment");

  const revenueByDay = paidOrders.reduce<Record<string, number>>((acc, order) => {
    const day = order.created_at.slice(0, 10);
    acc[day] = (acc[day] ?? 0) + Number(order.subtotal);
    return acc;
  }, {});

  const chartData = Object.entries(revenueByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, revenue]) => ({ date, revenue }));

  const methodBreakdown = paidOrders.reduce<Record<string, number>>((acc, order) => {
    const method = order.payment_method ?? "unknown";
    acc[method] = (acc[method] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold">Analytics</h1>
      <p className="mt-2 text-muted">Store performance for {store.name}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card/40 p-5">
          <p className="text-xs uppercase text-muted">Total orders</p>
          <p className="mt-2 font-heading text-2xl">{orders.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card/40 p-5">
          <p className="text-xs uppercase text-muted">Paid</p>
          <p className="mt-2 font-heading text-2xl text-emerald-400">{paidOrders.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card/40 p-5">
          <p className="text-xs uppercase text-muted">Pending payment</p>
          <p className="mt-2 font-heading text-2xl text-amber-400">{pendingOrders.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card/40 p-5">
          <p className="text-xs uppercase text-muted">Gross revenue</p>
          <p className="mt-2 font-heading text-2xl text-gold">
            ${paidOrders.reduce((s, o) => s + Number(o.subtotal), 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-heading text-lg font-semibold">Revenue (last 14 days)</h2>
        <MerchantAnalyticsChart data={chartData} />
      </div>

      <div className="mt-10">
        <h2 className="font-heading text-lg font-semibold">Payment methods</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {Object.entries(methodBreakdown).map(([method, count]) => (
            <li
              key={method}
              className="flex justify-between rounded-xl border border-border bg-card/40 px-4 py-3 text-sm"
            >
              <span className="capitalize">{method}</span>
              <span>{count} orders</span>
            </li>
          ))}
          {Object.keys(methodBreakdown).length === 0 && (
            <li className="text-muted">No paid orders yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
