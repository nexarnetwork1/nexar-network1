import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ShoppingBag } from "lucide-react";
import { getCurrentProfile } from "@/modules/users/repository";
import { getCustomerOrders } from "@/modules/orders/repository";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/utils/format";
import { CurrencyAmount } from "@/components/payments/CurrencyAmount";
import { OrderStatusFilter, filterOrdersByStatus } from "@/components/orders/OrderStatusFilter";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSection,
  DashboardStat,
  DashboardStats,
  DashboardTable,
  DashboardTableBody,
  DashboardTableCell,
  DashboardTableEmpty,
  DashboardTableHead,
  DashboardTableHeader,
  DashboardTableRow,
} from "@/components/dashboard";

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function CustomerOrdersPage({ searchParams }: Props) {
  const profile = await getCurrentProfile();
  if (!profile) {
  redirect("/login?redirect=/customer/orders");
}

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
    <div className="space-y-6">
      <DashboardSection
        as="div"
        level="h1"
        title="Orders"
        description="Track your purchases from pending to delivered"
      />

      <DashboardStats columns={7}>
        {[
          { label: "Pending", value: counts.pending },
          { label: "Paid", value: counts.paid },
          { label: "Processing", value: counts.processing },
          { label: "Shipped", value: counts.shipped },
          { label: "Delivered", value: counts.delivered },
          { label: "Cancelled", value: counts.cancelled },
          { label: "Refunded", value: counts.refunded },
        ].map((stat) => (
          <DashboardStat key={stat.label} compact label={stat.label} value={stat.value} />
        ))}
      </DashboardStats>

      <Suspense fallback={null}>
        <OrderStatusFilter />
      </Suspense>

      <DashboardCard flush className="overflow-hidden">
        <DashboardTable caption="Your orders" minWidth="52rem">
          <DashboardTableHead>
            <DashboardTableRow>
              <DashboardTableHeader>Order</DashboardTableHeader>
              <DashboardTableHeader>Store</DashboardTableHeader>
              <DashboardTableHeader>Amount</DashboardTableHeader>
              <DashboardTableHeader>Status</DashboardTableHeader>
              <DashboardTableHeader hideBelow="md">Fulfillment</DashboardTableHeader>
              <DashboardTableHeader hideBelow="sm">Date</DashboardTableHeader>
            </DashboardTableRow>
          </DashboardTableHead>
          <DashboardTableBody>
            {orders.length === 0 ? (
              <DashboardTableEmpty colSpan={6}>
                <DashboardEmptyState
                  inset
                  icon={<ShoppingBag className="h-5 w-5" aria-hidden />}
                  title="No orders in this category"
                  description="Orders you place in the marketplace will appear here."
                />
              </DashboardTableEmpty>
            ) : (
              orders.map((order) => (
                <DashboardTableRow key={order.id} interactive>
                  <DashboardTableCell>
                    <Link
                      href={`/customer/orders/${order.id}`}
                      className="font-mono text-gold hover:text-gold-secondary"
                    >
                      {order.id.slice(0, 8)}…
                    </Link>
                  </DashboardTableCell>
                  <DashboardTableCell>{order.store.name}</DashboardTableCell>
                  <DashboardTableCell>
                    <CurrencyAmount amount={Number(order.subtotal)} currency={order.currency} size={16} />
                  </DashboardTableCell>
                  <DashboardTableCell>
                    <StatusBadge status={order.status} />
                  </DashboardTableCell>
                  <DashboardTableCell hideBelow="md">
                    {order.status === "paid" ? (
                      <StatusBadge status={order.fulfillment_status ?? "pending"} />
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </DashboardTableCell>
                  <DashboardTableCell hideBelow="sm" className="text-muted">
                    {formatDate(order.created_at)}
                  </DashboardTableCell>
                </DashboardTableRow>
              ))
            )}
          </DashboardTableBody>
        </DashboardTable>
      </DashboardCard>
    </div>
  );
}
