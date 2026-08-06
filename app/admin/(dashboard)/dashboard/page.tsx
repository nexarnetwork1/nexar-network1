import Link from "next/link";
import { Activity } from "lucide-react";
import {
  getDashboardOverview,
  getLatestTransactions,
  getPlatformStats,
} from "@/modules/analytics/repository";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { ExportButton } from "@/components/admin/ExportButton";
import { RealtimeScope } from "@/components/realtime/RealtimeScope";
import { CurrencyAmount } from "@/components/payments/CurrencyAmount";
import { UsdAmount } from "@/components/payments/CurrencyAmount";
import { requireSuperAdmin } from "@/modules/users/repository";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSection,
  DashboardStats,
} from "@/components/dashboard";

export default async function AdminDashboardPage() {
  const session = await requireSuperAdmin();
  const [overview, stats, transactions] = await Promise.all([
    getDashboardOverview(),
    getPlatformStats(),
    getLatestTransactions(8),
  ]);

  return (
    <div className="space-y-8">
      <RealtimeScope userId={session.userId} />

      <DashboardSection
        as="div"
        level="h1"
        title="Platform overview"
        headingClassName="text-gold"
        description="Real-time platform health and revenue"
        actions={<ExportButton resource="orders" label="Export orders" />}
      />

      <DashboardStats columns={4}>
        <AdminStatCard label="Today's revenue" value={<UsdAmount amount={overview.todayRevenue} />} tone="success" />
        <AdminStatCard label="Monthly revenue" value={<UsdAmount amount={overview.monthlyRevenue} />} />
        <AdminStatCard label="Platform fee revenue" value={<UsdAmount amount={overview.platformFeeRevenue} />} tone="warning" />
        <AdminStatCard label="Today's orders" value={overview.todayOrders} />
        <AdminStatCard label="Today's payments" value={overview.todayPayments} />
        <AdminStatCard label="Active merchants" value={overview.activeMerchants} />
        <AdminStatCard label="Active customers" value={overview.activeCustomers} />
        <AdminStatCard label="Pending payments" value={overview.pendingPayments} tone="warning" />
        <AdminStatCard label="Failed payments" value={overview.failedPayments} tone="danger" />
      </DashboardStats>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard as="section">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-semibold text-gold">Latest transactions</h2>
            <Link href="/admin/payments" className="text-sm text-gold hover:underline">
              View all
            </Link>
          </div>

          {transactions.length === 0 ? (
            <DashboardEmptyState
              inset
              icon={<Activity className="h-5 w-5" aria-hidden />}
              title="No transactions yet"
              description="Platform payments and settlements will show up here."
            />
          ) : (
            <ul className="mt-4 space-y-3 text-sm">
              {transactions.map((tx) => (
                <li
                  key={`${tx.type}-${tx.id}`}
                  className="flex items-center justify-between gap-4 border-b border-border pb-2 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium capitalize">{tx.type}</p>
                    <p className="truncate text-xs text-muted">
                      {tx.reference ?? tx.id.slice(0, 8)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <CurrencyAmount amount={tx.amount} currency={tx.currency} size={16} />
                    <p className="text-xs capitalize text-muted">{tx.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        <DashboardCard as="section">
          <h2 className="font-heading text-lg font-semibold text-gold">Pending actions</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex justify-between gap-4">
              <span className="text-muted">Stores awaiting approval</span>
              <Link href="/admin/merchants" className="font-medium text-gold hover:underline">
                {stats.pendingStores}
              </Link>
            </li>
            <li className="flex justify-between gap-4">
              <span className="text-muted">Orders pending payment</span>
              <Link href="/admin/orders" className="font-medium hover:text-gold">
                {stats.pendingOrders}
              </Link>
            </li>
            <li className="flex justify-between gap-4">
              <span className="text-muted">New contact messages</span>
              <Link href="/admin/contact" className="font-medium hover:text-gold">
                {stats.newContactMessages}
              </Link>
            </li>
          </ul>

          <h3 className="mt-8 text-sm font-semibold text-white/80">Quick links</h3>
          <div className="mt-3 grid gap-2">
            <QuickLink href="/admin/marketplace" label="Marketplace administration" />
            <QuickLink href="/admin/revenue" label="Revenue reports" />
            <QuickLink href="/admin/treasury" label="Treasury wallet" />
            <QuickLink href="/admin/customers" label="Customer management" />
            <QuickLink href="/admin/products" label="Product moderation" />
            <QuickLink href="/admin/settings" label="Platform settings" />
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-11 items-center rounded-xl border border-gold/20 bg-gold/5 px-4 py-3 text-sm transition-colors hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
    >
      {label}
    </Link>
  );
}
