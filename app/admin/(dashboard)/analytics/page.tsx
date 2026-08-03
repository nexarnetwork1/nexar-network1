import { Package, Store, TrendingUp } from "lucide-react";
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
import { UsdAmount } from "@/components/payments/CurrencyAmount";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSection,
  DashboardStats,
} from "@/components/dashboard";

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
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title="Analytics"
        headingClassName="text-gold"
        description="Platform performance overview"
        actions={<ExportButton resource="payments" label="Export payments" />}
      />

      <DashboardSection level="h3" title="Revenue & fees (6 months)">
        <RevenueChart data={monthlyRevenue} />
      </DashboardSection>

      <DashboardStats columns={3}>
        <AdminStatCard label="Total revenue (paid orders)" value={<UsdAmount amount={stats.totalRevenue} size={20} />} />
        <AdminStatCard label="Platform fees collected" value={<UsdAmount amount={stats.totalPlatformFees} size={20} />} tone="warning" />
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
      </DashboardStats>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard as="section">
          <h2 className="font-heading text-lg font-semibold text-gold">Top merchants</h2>
          {topMerchants.length === 0 ? (
            <DashboardEmptyState
              inset
              icon={<Store className="h-5 w-5" aria-hidden />}
              title="No merchant revenue yet"
              description="Merchants will be ranked here once orders are paid."
            />
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {topMerchants.map((m) => (
                <li key={m.store_id} className="flex flex-wrap justify-between gap-2">
                  <span className="min-w-0 truncate">{m.store_name}</span>
                  <UsdAmount amount={m.revenue} size={16} amountClassName="text-muted" />
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        <DashboardCard as="section">
          <h2 className="font-heading text-lg font-semibold text-gold">Top products</h2>
          {topProducts.length === 0 ? (
            <DashboardEmptyState
              inset
              icon={<Package className="h-5 w-5" aria-hidden />}
              title="No product sales yet"
              description="Best-selling catalog items will be listed here."
            />
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {topProducts.map((p) => (
                <li key={p.product_id} className="flex flex-wrap justify-between gap-2">
                  <span className="min-w-0 truncate">{p.product_name}</span>
                  <span className="text-muted">{p.units_sold} sold</span>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>
      </div>

      <DashboardCard as="section">
        <h2 className="font-heading text-lg font-semibold text-gold">User growth (6 months)</h2>
        {growth.length === 0 ? (
          <DashboardEmptyState
            inset
            icon={<TrendingUp className="h-5 w-5" aria-hidden />}
            title="No growth data yet"
            description="Monthly customer and merchant sign-ups will appear here."
          />
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {growth.map((g) => (
              <li key={g.month} className="flex flex-wrap justify-between gap-2">
                <span>{g.month}</span>
                <span className="text-muted">
                  +{g.customers} customers · +{g.merchants} merchants
                </span>
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>

      <DashboardCard>
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
          Settlement recovery
        </p>
        <p className="mt-2 text-sm text-muted">
          Re-attempt on-chain payouts for crypto settlements marked failed.
        </p>
        <div className="mt-4">
          <RetrySettlementsButton />
        </div>
      </DashboardCard>
    </div>
  );
}
