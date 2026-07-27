import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { getCustomerOrders } from "@/modules/orders/repository";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function CustomerOrdersPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const orders = await getCustomerOrders(profile.id);

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold">Orders</h1>
      <p className="mt-2 text-muted">Track your purchases</p>

      {orders.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-border bg-card/40 p-12 text-center text-muted">
          No orders yet.
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50 text-left text-muted">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/customer/orders/${order.id}`}
                      className="font-mono text-gold hover:text-gold-secondary"
                    >
                      {order.id.slice(0, 8)}…
                    </Link>
                  </td>
                  <td className="px-4 py-3">{order.store.name}</td>
                  <td className="px-4 py-3">
                    {order.currency} {Number(order.subtotal).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
