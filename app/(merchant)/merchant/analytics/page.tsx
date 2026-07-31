import { redirect } from "next/navigation";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getMerchantAnalytics } from "@/modules/analytics/merchant";
import { MerchantAnalyticsChart } from "@/components/merchant/MerchantAnalyticsChart";
import { UsdAmount, CurrencyAmount } from "@/components/payments/CurrencyAmount";
import { PaymentMethodLogo } from "@/components/payments/PaymentMethodLogo";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";

export default async function MerchantAnalyticsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect(commerceAuthHref({ auth: "signin", redirect: "/merchant/analytics" }));

  const store = await getMerchantStore(profile.id);
  if (!store) redirect("/merchant");

  const analytics = await getMerchantAnalytics(store.id);

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold">Analytics</h1>
      <p className="mt-2 text-muted">Store performance for {store.name}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenue" value={<UsdAmount amount={analytics.revenue} size={24} amountClassName="font-heading text-2xl text-gold" />} />
        <Stat label="Orders" value={analytics.orders} />
        <Stat label="Customers" value={analytics.customers} />
        <Stat label="Products" value={analytics.products} />
        <Stat label="Conversion rate" value={`${analytics.conversionRate}%`} />
      </div>

      <div className="mt-10">
        <h2 className="font-heading text-lg font-semibold">Sales chart (30 days)</h2>
        <MerchantAnalyticsChart data={analytics.revenueByDay} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="font-heading text-lg font-semibold">Top selling products</h2>
          <ul className="mt-4 space-y-2">
            {analytics.topProducts.map((p) => (
              <li key={p.id} className="flex justify-between rounded-xl border border-border bg-card/40 px-4 py-3 text-sm">
                <span>{p.name}</span>
                <span className="text-muted">{p.units} sold · ${p.revenue.toFixed(2)}</span>
              </li>
            ))}
            {analytics.topProducts.length === 0 && <li className="text-muted">No sales yet.</li>}
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">Best customers</h2>
          <ul className="mt-4 space-y-2">
            {analytics.bestCustomers.map((c) => (
              <li key={c.id} className="flex justify-between rounded-xl border border-border bg-card/40 px-4 py-3 text-sm">
                <span>{c.name}</span>
                <span className="text-muted">{c.orders} orders · ${c.spent.toFixed(2)}</span>
              </li>
            ))}
            {analytics.bestCustomers.length === 0 && <li className="text-muted">No customers yet.</li>}
          </ul>
        </section>
      </div>

      <div className="mt-10">
        <h2 className="font-heading text-lg font-semibold">Orders by currency</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {analytics.ordersByCurrency.map((row) => (
            <li key={row.currency} className="flex justify-between rounded-xl border border-border bg-card/40 px-4 py-3 text-sm">
              <CurrencyAmount amount={row.revenue} currency={row.currency} size={18} />
              <span>{row.count} orders</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10">
        <h2 className="font-heading text-lg font-semibold">Latest orders</h2>
        <ul className="mt-4 space-y-2">
          {analytics.latestOrders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/merchant/orders/${order.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-card/40 px-4 py-3 text-sm hover:border-gold/30"
              >
                <span className="font-mono text-gold">{order.id.slice(0, 8)}…</span>
                <StatusBadge status={order.status} />
                <CurrencyAmount amount={Number(order.subtotal)} currency={order.currency} size={16} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5">
      <p className="text-xs uppercase text-muted">{label}</p>
      <div className="mt-2 font-heading text-2xl">{value}</div>
    </div>
  );
}
