import {
  getDashboardOverview,
  getMonthlyRevenue,
  getPlatformStats,
} from "@/modules/analytics/repository";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { ExportButton } from "@/components/admin/ExportButton";

export default async function AdminRevenuePage() {
  const [overview, stats, monthlyRevenue] = await Promise.all([
    getDashboardOverview(),
    getPlatformStats(),
    getMonthlyRevenue(12),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-yellow-400">Revenue</h1>
          <p className="mt-2 text-zinc-400">Platform revenue and fee collection</p>
        </div>
        <ExportButton resource="payments" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="Total revenue" value={`$${stats.totalRevenue.toFixed(2)}`} />
        <AdminStatCard label="Platform fees" value={`$${stats.totalPlatformFees.toFixed(2)}`} tone="warning" />
        <AdminStatCard label="Today" value={`$${overview.todayRevenue.toFixed(2)}`} tone="success" />
        <AdminStatCard label="This month" value={`$${overview.monthlyRevenue.toFixed(2)}`} />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">12-month trend</h2>
        <RevenueChart data={monthlyRevenue} />
      </section>
    </div>
  );
}
