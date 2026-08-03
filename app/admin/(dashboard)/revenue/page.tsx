import {
  getDashboardOverview,
  getMonthlyRevenue,
  getPlatformStats,
} from "@/modules/analytics/repository";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { ExportButton } from "@/components/admin/ExportButton";
import { UsdAmount } from "@/components/payments/CurrencyAmount";
import { DashboardSection, DashboardStats } from "@/components/dashboard";

export default async function AdminRevenuePage() {
  const [overview, stats, monthlyRevenue] = await Promise.all([
    getDashboardOverview(),
    getPlatformStats(),
    getMonthlyRevenue(12),
  ]);

  return (
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title="Revenue"
        headingClassName="text-gold"
        description="Platform revenue and fee collection"
        actions={<ExportButton resource="payments" />}
      />

      <DashboardStats columns={4}>
        <AdminStatCard label="Total revenue" value={<UsdAmount amount={stats.totalRevenue} size={20} />} />
        <AdminStatCard label="Platform fees" value={<UsdAmount amount={stats.totalPlatformFees} size={20} />} tone="warning" />
        <AdminStatCard label="Today" value={<UsdAmount amount={overview.todayRevenue} size={20} />} tone="success" />
        <AdminStatCard label="This month" value={<UsdAmount amount={overview.monthlyRevenue} size={20} />} />
      </DashboardStats>

      <DashboardSection level="h3" title="12-month trend">
        <RevenueChart data={monthlyRevenue} />
      </DashboardSection>
    </div>
  );
}
