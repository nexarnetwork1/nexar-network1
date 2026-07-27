import {
  getPlatformStats,
  getMonthlyRevenue,
  getTopMerchants,
  getTopProducts,
  getGrowthStats,
} from "@/modules/analytics/repository";
import { getAllSettlements } from "@/modules/platform/repository";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { RetrySettlementsButton } from "@/components/admin/RetrySettlementsButton";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { ExportButton } from "@/components/admin/ExportButton";

export default async function AdminAnalyticsPage() {
  const [stats, settlements, monthlyRevenue, topMerchants, topProducts, growth] =
    await Promise.all([
      getPlatformStats(),
      getAllSettlements(),
      getMonthlyRevenue(6),
      getTopMerchants(5),
      getTopProducts(5),
      getGrowthStats(6),
    ]);

  const completedSettlements = settlements.filter((s) => s.status === "completed");
  const failedSettlements = settlements.filter((s) => s.status === "failed");

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-yellow-400">Analytics</h1>
          <p className="mt-2 text-zinc-400">Platform performance overview</p>
        </div>
        <ExportButton resource="payments" label="Export payments" />
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Revenue & fees (6 months)</h2>
        <RevenueChart data={monthlyRevenue} />
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard label="Total revenue (paid orders)" value={`$${stats.totalRevenue.toFixed(2)}`} />
        <AdminStatCard label="Platform fees collected" value={`$${stats.totalPlatformFees.toFixed(2)}`} tone="warning" />
        <AdminStatCard label="Total orders" value={String(stats.totalOrders)} />
        <AdminStatCard label="Customers" value={String(stats.totalCustomers)} />
        <AdminStatCard label="Merchants" value={String(stats.totalMerchants)} />
        <AdminStatCard label="Active stores" value={String(stats.activeStores)} />
        <AdminStatCard label="Completed settlements" value={String(completedSettlements.length)} />
        <AdminStatCard label="Failed settlements" value={String(failedSettlements.length)} tone="danger" />
        <AdminStatCard
          label="Payment success rate"
          value={
            stats.totalPayments > 0
              ? `${Math.round((stats.paidPayments / stats.totalPayments) * 100)}%`
              : "—"
          }
        />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold text-yellow-400">Top merchants</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {topMerchants.map((m) => (
              <li key={m.store_id} className="flex justify-between">
                <span>{m.store_name}</span>
                <span className="text-zinc-400">${m.revenue.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold text-yellow-400">Top products</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {topProducts.map((p) => (
              <li key={p.product_id} className="flex justify-between">
                <span>{p.product_name}</span>
                <span className="text-zinc-400">{p.units_sold} sold</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-white/10 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-yellow-400">User growth (6 months)</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {growth.map((g) => (
            <li key={g.month} className="flex justify-between">
              <span>{g.month}</span>
              <span className="text-zinc-400">+{g.customers} customers · +{g.merchants} merchants</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 rounded-2xl border border-white/10 bg-zinc-900 p-5">
        <p className="text-xs uppercase tracking-wider text-zinc-500">Settlement recovery</p>
        <p className="mt-2 text-sm text-zinc-400">
          Re-attempt on-chain payouts for crypto settlements marked failed.
        </p>
        <div className="mt-4">
          <RetrySettlementsButton />
        </div>
      </div>
    </div>
  );
}
