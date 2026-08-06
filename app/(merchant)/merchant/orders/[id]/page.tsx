import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { PackageOpen } from "lucide-react";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getOrderById } from "@/modules/orders/repository";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CancelOrderButton } from "@/components/orders/CancelOrderButton";
import { FulfillmentActions } from "@/components/orders/FulfillmentActions";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { CurrencyAmount } from "@/components/payments/CurrencyAmount";
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

type Props = { params: Promise<{ id: string }> };

export default async function MerchantOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) {
  redirect("/login?redirect=" + encodeURIComponent(`/merchant/orders/${id}`));
}

  const store = await getMerchantStore(profile.id);
  if (!store) redirect("/merchant");

  const order = await getOrderById(id);
  if (!order || order.store_id !== store.id) notFound();

  return (
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title="Order"
        actions={<StatusBadge status={order.status} />}
      />

      <DashboardStats columns={3}>
        <DashboardStat
          label="Subtotal"
          value={
            <CurrencyAmount amount={Number(order.subtotal)} currency={order.currency} size={16} />
          }
        />
        <DashboardStat
          label="Platform fee"
          value={
            <CurrencyAmount
              amount={Number(order.platform_fee)}
              currency={order.currency}
              size={16}
            />
          }
        />
        <DashboardStat
          label="Merchant amount"
          tone="gold"
          value={
            <CurrencyAmount
              amount={Number(order.merchant_amount)}
              currency={order.currency}
              size={16}
            />
          }
        />
      </DashboardStats>

      <DashboardSection title="Items" level="h2">
        <DashboardCard flush className="overflow-hidden">
          <DashboardTable caption="Items in this order" minWidth="32rem">
            <DashboardTableHead>
              <DashboardTableRow>
                <DashboardTableHeader>Product</DashboardTableHeader>
                <DashboardTableHeader>Qty</DashboardTableHeader>
                <DashboardTableHeader align="right">Line total</DashboardTableHeader>
              </DashboardTableRow>
            </DashboardTableHead>
            <DashboardTableBody>
              {order.items.length === 0 ? (
                <DashboardTableEmpty colSpan={3}>
                  <DashboardEmptyState
                    inset
                    icon={<PackageOpen className="h-5 w-5" aria-hidden />}
                    title="No line items"
                    description="This order was created without any product line items."
                  />
                </DashboardTableEmpty>
              ) : (
                order.items.map((item) => (
                  <DashboardTableRow key={item.id} interactive>
                    <DashboardTableCell wrap>{item.product_name}</DashboardTableCell>
                    <DashboardTableCell>{item.quantity}</DashboardTableCell>
                    <DashboardTableCell align="right">
                      <CurrencyAmount
                        amount={Number(item.line_total)}
                        currency={order.currency}
                        size={16}
                      />
                    </DashboardTableCell>
                  </DashboardTableRow>
                ))
              )}
            </DashboardTableBody>
          </DashboardTable>
        </DashboardCard>
      </DashboardSection>

      {order.status === "paid" && (
        <div className="flex flex-wrap items-center gap-4">
          <FulfillmentActions orderId={order.id} currentStatus={order.fulfillment_status} />
          {order.fulfillment_status && <StatusBadge status={order.fulfillment_status} />}
        </div>
      )}

      {order.status === "paid" && (
        <DashboardSection title="Fulfillment timeline" level="h2" className="max-w-md">
          <DashboardCard as="aside">
            <OrderTimeline
              status={order.status}
              fulfillmentStatus={order.fulfillment_status}
              createdAt={order.created_at}
              paidAt={order.paid_at}
              shippedAt={order.shipped_at}
              deliveredAt={order.delivered_at}
            />
          </DashboardCard>
        </DashboardSection>
      )}

      {order.status === "pending_payment" && (
        <div>
          <CancelOrderButton orderId={order.id} scope="merchant" />
        </div>
      )}

      {order.invoice && (
        <div>
          <Link
            href={`/merchant/invoices/${order.invoice.id}`}
            className="inline-flex min-h-11 items-center rounded-md text-gold hover:text-gold-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
          >
            Invoice {order.invoice.invoice_number} →
          </Link>
        </div>
      )}
    </div>
  );
}
