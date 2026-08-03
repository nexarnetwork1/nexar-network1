import { redirect } from "next/navigation";
import { Coins, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getMerchantAnalytics } from "@/modules/analytics/merchant";
import { MerchantAnalyticsChart } from "@/components/merchant/MerchantAnalyticsChart";
import { UsdAmount, CurrencyAmount } from "@/components/payments/CurrencyAmount";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSection,
  DashboardStat,
  DashboardStats,
} from "@/components/dashboard";

export default async function MerchantAnalyticsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect(commerceAuthHref({ auth: "signin", redirect: "/merchant/analytics" }));

  const store = await getMerchantStore(profile.id);
  if (!store) redirect("/merchant");

  const analytics = await getMerchantAnalytics(store.id);

  return (
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title="Analytics"
        description={`Store performance for ${store.name}`}
      />

      <DashboardStats columns={5}>
        <DashboardStat
          label="Revenue"
          tone="gold"
          value={<UsdAmount amount={analytics.revenue} size={20} />}
        />
        <DashboardStat label="Orders" value={analytics.orders} />
        <DashboardStat label="Customers" value={analytics.customers} />
        <DashboardStat label="Products" value={analytics.products} />
        <DashboardStat label="Conversion rate" value={`${analytics.conversionRate}%`} />
      </DashboardStats>

      <DashboardSection title="Sales chart (30 days)" level="h3">
        <MerchantAnalyticsChart data={analytics.revenueByDay} />
      </DashboardSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection title="Top selling products" level="h3">
          {analytics.topProducts.length === 0 ? (
            <DashboardEmptyState
              icon={<TrendingUp className="h-5 w-5" aria-hidden />}
              title="No sales yet"
              description="Your best performing products will appear here once orders come in."
            />
          ) : (
            <ul className="space-y-2">
              {analytics.topProducts.map((p) => (
                <DashboardCard
                  as="li"
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                >
                  <span className="min-w-0 break-words">{p.name}</span>
                  <span className="text-muted">
                    {p.units} sold · ${p.revenue.toFixed(2)}
                  </span>
                </DashboardCard>
              ))}
            </ul>
          )}
        </DashboardSection>

        <DashboardSection title="Best customers" level="h3">
          {analytics.bestCustomers.length === 0 ? (
            <DashboardEmptyState
              icon={<Users className="h-5 w-5" aria-hidden />}
              title="No customers yet"
              description="Customers who buy from your store will be ranked here."
            />
          ) : (
            <ul className="space-y-2">
              {analytics.bestCustomers.map((c) => (
                <DashboardCard
                  as="li"
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                >
                  <span className="min-w-0 break-words">{c.name}</span>
                  <span className="text-muted">
                    {c.orders} orders · ${c.spent.toFixed(2)}
                  </span>
                </DashboardCard>
              ))}
            </ul>
          )}
        </DashboardSection>
      </div>

      <DashboardSection title="Orders by currency" level="h3">
        {analytics.ordersByCurrency.length === 0 ? (
          <DashboardEmptyState
            icon={<Coins className="h-5 w-5" aria-hidden />}
            title="No currency breakdown yet"
            description="Paid orders will be grouped by the currency they settled in."
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {analytics.ordersByCurrency.map((row) => (
              <DashboardCard
                as="li"
                key={row.currency}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <CurrencyAmount amount={row.revenue} currency={row.currency} size={18} />
                <span>{row.count} orders</span>
              </DashboardCard>
            ))}
          </ul>
        )}
      </DashboardSection>

      <DashboardSection title="Latest orders" level="h3">
        {analytics.latestOrders.length === 0 ? (
          <DashboardEmptyState
            icon={<ShoppingBag className="h-5 w-5" aria-hidden />}
            title="No orders yet"
            description="Your most recent orders will be listed here."
          />
        ) : (
          <ul className="space-y-2">
            {analytics.latestOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/merchant/orders/${order.id}`}
                  className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                >
                  <DashboardCard
                    interactive
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <span className="font-mono text-gold">{order.id.slice(0, 8)}…</span>
                    <StatusBadge status={order.status} />
                    <CurrencyAmount
                      amount={Number(order.subtotal)}
                      currency={order.currency}
                      size={16}
                    />
                  </DashboardCard>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DashboardSection>
    </div>
  );
}
