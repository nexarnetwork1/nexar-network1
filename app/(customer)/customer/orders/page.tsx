import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentProfile } from "@/modules/users/repository";
import { getCustomerOrders } from "@/modules/orders/repository";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/utils/format";
import { CurrencyAmount } from "@/components/payments/CurrencyAmount";
import { OrderStatusFilter, filterOrdersByStatus } from "@/components/orders/OrderStatusFilter";

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function CustomerOrdersPage({ searchParams }: Props) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { status: statusFilter } = await searchParams;
  const allOrders = await getCustomerOrders(profile.id);
  const orders = filterOrdersByStatus(allOrders, statusFilter ?? null);

  const counts = {
    pending: allOrders.filter((o) => o.status === "pending_payment").length,
    paid: allOrders.filter((o) => o.status === "paid").length,
    processing: allOrders.filter((o) => o.status === "paid" && o.fulfillment_status === "processing").length,
    shipped: allOrders.filter((o) => o.status === "paid" && o.fulfillment_status === "shipped").length,
    delivered: allOrders.filter((o) => o.status === "paid" && o.fulfillment_status === "delivered").length,
    cancelled: allOrders.filter((o) => ["cancelled", "expired"].includes(o.status)).length,
    refunded: allOrders.filter((o) => o.status === "refunded").length,
  };

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold">Orders</h1>
      <p className="mt-2 text-muted">Track your purchases from pending to delivered</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {[
          { label: "Pending", value: counts.pending },
          { label: "Paid", value: counts.paid },
          { label: "Processing", value: counts.processing },
          { label: "Shipped", value: counts.shipped },
          { label: "Delivered", value: counts.delivered },
          { label: "Cancelled", value: counts.cancelled },
          { label: "Refunded", value: counts.refunded },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card/40 p-3 text-center">
            <p className="text-xs text-muted">{stat.label}</p>
            <p className="mt-1 font-heading text-xl">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Suspense fallback={null}>
          <OrderStatusFilter />
        </Suspense>
      </div>

      {orders.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-border bg-card/40 p-12 text-center text-muted">
          No orders in this category.
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50 text-left text-muted">
                <th className="px-4 py-3" scope="col">Order</th>
                <th className="px-4 py-3" scope="col">Store</th>
                <th className="px-4 py-3" scope="col">Amount</th>
                <th className="px-4 py-3" scope="col">Status</th>
                <th className="px-4 py-3" scope="col">Fulfillment</th>
                <th className="px-4 py-3" scope="col">Date</th>
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
                    <CurrencyAmount amount={Number(order.subtotal)} currency={order.currency} size={16} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3">
                    {order.status === "paid" ? (
                      <StatusBadge status={order.fulfillment_status ?? "pending"} />
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(order.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
