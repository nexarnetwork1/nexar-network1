import { redirect } from "next/navigation";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getMerchantOrders } from "@/modules/orders/repository";
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

export default async function MerchantOrdersPage() {
  const profile = await getCurrentProfile();
 if (!profile) {
  redirect("/login?redirect=/merchant/orders");
}

  const store = await getMerchantStore(profile.id);
  if (!store) redirect("/merchant");

  const orders = await getMerchantOrders(store.id);

  return (
    <div className="space-y-6">
      <DashboardSection
        as="div"
        level="h1"
        title="Orders"
        description={`Orders for ${store.name}`}
      />

      <DashboardCard flush className="overflow-hidden">
        <DashboardTable caption="Store orders" minWidth="38rem">
          <DashboardTableHead>
            <DashboardTableRow>
              <DashboardTableHeader>Order</DashboardTableHeader>
              <DashboardTableHeader>Amount</DashboardTableHeader>
              <DashboardTableHeader>Status</DashboardTableHeader>
              <DashboardTableHeader hideBelow="sm">Date</DashboardTableHeader>
            </DashboardTableRow>
          </DashboardTableHead>
          <DashboardTableBody>
            {orders.length === 0 ? (
              <DashboardTableEmpty colSpan={4}>
                <DashboardEmptyState
                  inset
                  icon={<ShoppingBag className="h-5 w-5" aria-hidden />}
                  title="No orders yet"
                  description="Orders placed in your store will appear here."
                />
              </DashboardTableEmpty>
            ) : (
              orders.map((order) => (
                <DashboardTableRow key={order.id} interactive>
                  <DashboardTableCell>
                    <Link
                      href={`/merchant/orders/${order.id}`}
                      className="font-mono text-gold hover:text-gold-secondary"
                    >
                      {order.id.slice(0, 8)}…
                    </Link>
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
