import Link from "next/link";
import {
  getDashboardOverview,
  getLatestTransactions,
  getPlatformStats,
} from "@/modules/analytics/repository";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { ExportButton } from "@/components/admin/ExportButton";
import { RealtimeScope } from "@/components/realtime/RealtimeScope";
import { requireRole } from "@/modules/users/repository";

export default async function AdminDashboardPage() {
  const profile = await requireRole(["admin"]);
  const [overview, stats, transactions] = await Promise.all([
    getDashboardOverview(),
    getPlatformStats(),
    getLatestTransactions(8),
  ]);

  return (
    <div>
      <RealtimeScope userId={profile.id} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-yellow-400">Platform overview</h1>
          <p className="mt-2 text-zinc-400">Real-time platform health and revenue</p>
        </div>
        <ExportButton resource="orders" label="Export orders" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Today's revenue" value={`$${overview.todayRevenue.toFixed(2)}`} tone="success" />
        <AdminStatCard label="Monthly revenue" value={`$${overview.monthlyRevenue.toFixed(2)}`} />
        <AdminStatCard label="Platform fee revenue" value={`$${overview.platformFeeRevenue.toFixed(2)}`} tone="warning" />
        <AdminStatCard label="Today's orders" value={overview.todayOrders} />
        <AdminStatCard label="Today's payments" value={overview.todayPayments} />
        <AdminStatCard label="Active merchants" value={overview.activeMerchants} />
        <AdminStatCard label="Active customers" value={overview.activeCustomers} />
        <AdminStatCard label="Pending payments" value={overview.pendingPayments} tone="warning" />
        <AdminStatCard label="Failed payments" value={overview.failedPayments} tone="danger" />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-yellow-400">Latest transactions</h2>
            <Link href="/admin/payments" className="text-sm text-yellow-400 hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {transactions.map((tx) => (
              <li key={`${tx.type}-${tx.id}`} className="flex items-center justify-between border-b border-white/5 pb-2">
                <div>
                  <p className="font-medium capitalize">{tx.type}</p>
                  <p className="text-xs text-zinc-500">{tx.reference ?? tx.id.slice(0, 8)}</p>
                </div>
                <div className="text-right">
                  <p>${tx.amount.toFixed(2)} {tx.currency}</p>
                  <p className="text-xs capitalize text-zinc-500">{tx.status}</p>
                </div>
              </li>
            ))}
            {transactions.length === 0 && (
              <li className="text-zinc-500">No transactions yet.</li>
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold text-yellow-400">Pending actions</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex justify-between">
              <span className="text-zinc-400">Stores awaiting approval</span>
              <Link href="/admin/merchants" className="font-medium text-yellow-400">{stats.pendingStores}</Link>
            </li>
            <li className="flex justify-between">
              <span className="text-zinc-400">Orders pending payment</span>
              <Link href="/admin/orders" className="font-medium">{stats.pendingOrders}</Link>
            </li>
            <li className="flex justify-between">
              <span className="text-zinc-400">New contact messages</span>
              <Link href="/admin/contact" className="font-medium">{stats.newContactMessages}</Link>
            </li>
          </ul>

          <h3 className="mt-8 text-sm font-semibold text-zinc-300">Quick links</h3>
          <div className="mt-3 grid gap-2">
            <QuickLink href="/admin/revenue" label="Revenue reports" />
            <QuickLink href="/admin/treasury" label="Treasury wallet" />
            <QuickLink href="/admin/customers" label="Customer management" />
            <QuickLink href="/admin/products" label="Product moderation" />
            <QuickLink href="/admin/settings" label="Platform settings" />
          </div>
        </section>
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-sm transition hover:bg-yellow-500/10"
    >
      {label}
    </Link>
  );
}
