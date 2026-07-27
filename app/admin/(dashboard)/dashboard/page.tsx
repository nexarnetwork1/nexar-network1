import Link from "next/link";
import { getPlatformStats } from "@/modules/analytics/repository";

export default async function AdminDashboardPage() {
  const stats = await getPlatformStats();

  const cards = [
    { title: "Users", value: stats.totalUsers, href: "/admin/users" },
    { title: "Active stores", value: stats.activeStores, href: "/admin/merchants" },
    { title: "Paid orders", value: stats.paidOrders, href: "/admin/orders" },
    { title: "Platform fees", value: `$${stats.totalPlatformFees.toFixed(2)}`, href: "/admin/analytics" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-400">Platform dashboard</h1>
      <p className="mt-2 text-zinc-400">Nexar Network administration</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="rounded-2xl border border-white/10 bg-zinc-900 p-6 transition hover:border-yellow-500/30"
          >
            <p className="text-sm text-zinc-400">{card.title}</p>
            <p className="mt-2 text-3xl font-bold">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold text-yellow-400">Pending actions</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex justify-between">
              <span className="text-zinc-400">Stores awaiting approval</span>
              <span className="font-medium">{stats.pendingStores}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-zinc-400">Orders pending payment</span>
              <span className="font-medium">{stats.pendingOrders}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-zinc-400">Payments completed</span>
              <span className="font-medium">{stats.paidPayments}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-zinc-400">New contact messages</span>
              <span className="font-medium">{stats.newContactMessages}</span>
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold text-yellow-400">Quick links</h2>
          <div className="mt-4 grid gap-2">
            <QuickLink href="/admin/merchants" label="Approve merchants" />
            <QuickLink href="/admin/platform-fees" label="Configure fees" />
            <QuickLink href="/admin/audit-logs" label="View audit logs" />
            <QuickLink href="/admin/contact" label="Contact messages" />
            <QuickLink href="/admin/security" label="Security settings" />
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
