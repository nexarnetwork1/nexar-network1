import Link from "next/link";
import { getAllOrders } from "@/modules/orders/repository";
import { requireSuperAdmin } from "@/modules/users/repository";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CurrencyAmount } from "@/components/payments/CurrencyAmount";

export default async function AdminOrdersPage() {
  await requireSuperAdmin();

  const orders = await getAllOrders();

  return (
    <div>
      <Link href="/admin/dashboard" className="text-sm text-muted hover:text-yellow-400">
        ← Dashboard
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-yellow-400">Orders</h1>
      <p className="mt-2 text-zinc-400">All platform orders</p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-zinc-900 text-left text-zinc-400">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Store</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-white/5">
                <td className="px-4 py-3 font-mono text-yellow-400/80">
                  <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                    {order.id.slice(0, 8)}…
                  </Link>
                </td>
                <td className="px-4 py-3">{order.store.name}</td>
                <td className="px-4 py-3">
                  <CurrencyAmount amount={Number(order.subtotal)} currency={order.currency} size={16} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
