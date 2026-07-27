import { getPlatformStats, getMonthlyRevenue } from "@/modules/analytics/repository";
import { getAllSettlements } from "@/modules/platform/repository";
import { RevenueChart } from "@/components/admin/RevenueChart";

export default async function AdminAnalyticsPage() {
  const [stats, settlements, monthlyRevenue] = await Promise.all([
    getPlatformStats(),
    getAllSettlements(),
    getMonthlyRevenue(6),
  ]);

  const completedSettlements = settlements.filter((s) => s.status === "completed");
  const failedSettlements = settlements.filter((s) => s.status === "failed");

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-400">Analytics</h1>
      <p className="mt-2 text-zinc-400">Platform performance overview</p>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Revenue & fees (6 months)</h2>
        <RevenueChart data={monthlyRevenue} />
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total revenue (paid orders)" value={`$${stats.totalRevenue.toFixed(2)}`} />
        <StatCard label="Platform fees collected" value={`$${stats.totalPlatformFees.toFixed(2)}`} />
        <StatCard label="Total orders" value={String(stats.totalOrders)} />
        <StatCard label="Customers" value={String(stats.totalCustomers)} />
        <StatCard label="Merchants" value={String(stats.totalMerchants)} />
        <StatCard label="Active stores" value={String(stats.activeStores)} />
        <StatCard label="Completed settlements" value={String(completedSettlements.length)} />
        <StatCard label="Failed settlements" value={String(failedSettlements.length)} />
        <StatCard
          label="Payment success rate"
          value={
            stats.totalPayments > 0
              ? `${Math.round((stats.paidPayments / stats.totalPayments) * 100)}%`
              : "—"
          }
        />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
