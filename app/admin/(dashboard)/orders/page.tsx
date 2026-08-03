import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { getAllOrders } from "@/modules/orders/repository";
import { requireSuperAdmin } from "@/modules/users/repository";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CurrencyAmount } from "@/components/payments/CurrencyAmount";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSection,
  DashboardTable,
  DashboardTableBody,
  DashboardTableCell,
  DashboardTableEmpty,
  DashboardTableHead,
  DashboardTableHeader,
  DashboardTableRow,
} from "@/components/dashboard";

export default async function AdminOrdersPage() {
  await requireSuperAdmin();

  const orders = await getAllOrders();

  return (
    <div className="space-y-6">
      <DashboardSection as="div" level="h1" title="Orders" description="All platform orders" />

      <DashboardCard flush className="overflow-hidden">
        <DashboardTable caption="All platform orders" minWidth="48rem">
          <DashboardTableHead>
            <DashboardTableRow>
              <DashboardTableHeader>Order</DashboardTableHeader>
              <DashboardTableHeader hideBelow="md">Store</DashboardTableHeader>
              <DashboardTableHeader>Amount</DashboardTableHeader>
              <DashboardTableHeader>Status</DashboardTableHeader>
              <DashboardTableHeader hideBelow="sm">Date</DashboardTableHeader>
            </DashboardTableRow>
          </DashboardTableHead>
          <DashboardTableBody>
            {orders.length === 0 ? (
              <DashboardTableEmpty colSpan={5}>
                <DashboardEmptyState
                  inset
                  icon={<ShoppingCart className="h-5 w-5" aria-hidden />}
                  title="No orders yet"
                  description="Orders placed anywhere on the platform will show up here."
                />
              </DashboardTableEmpty>
            ) : (
              orders.map((order) => (
                <DashboardTableRow key={order.id} interactive>
                  <DashboardTableCell>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="rounded font-mono text-gold hover:text-gold-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                    >
                      {order.id.slice(0, 8)}…
                    </Link>
                  </DashboardTableCell>
                  <DashboardTableCell hideBelow="md" wrap>
                    {order.store.name}
                  </DashboardTableCell>
                  <DashboardTableCell>
                    <CurrencyAmount amount={Number(order.subtotal)} currency={order.currency} size={16} />
                  </DashboardTableCell>
                  <DashboardTableCell>
                    <StatusBadge status={order.status} />
                  </DashboardTableCell>
                  <DashboardTableCell hideBelow="sm" className="text-muted">
                    {new Date(order.created_at).toLocaleDateString()}
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
