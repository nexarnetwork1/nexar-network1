import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getOrderById } from "@/modules/orders/repository";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CancelOrderButton } from "@/components/orders/CancelOrderButton";
import { FulfillmentActions } from "@/components/orders/FulfillmentActions";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { CurrencyAmount } from "@/components/payments/CurrencyAmount";

type Props = { params: Promise<{ id: string }> };

export default async function MerchantOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const store = await getMerchantStore(profile.id);
  if (!store) redirect("/merchant");

  const order = await getOrderById(id);
  if (!order || order.store_id !== store.id) notFound();

  return (
    <div>
      <Link href="/merchant/orders" className="text-sm text-muted hover:text-gold">
        ← Back to orders
      </Link>

      <div className="mt-4 flex items-center gap-4">
        <h1 className="font-heading text-3xl font-semibold">Order</h1>
        <StatusBadge status={order.status} />
      </div>

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <dt className="text-xs text-muted">Subtotal</dt>
          <dd className="mt-1 font-medium">
            <CurrencyAmount amount={Number(order.subtotal)} currency={order.currency} size={16} />
          </dd>
        </div>
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <dt className="text-xs text-muted">Platform fee</dt>
          <dd className="mt-1">
            <CurrencyAmount amount={Number(order.platform_fee)} currency={order.currency} size={16} />
          </dd>
        </div>
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <dt className="text-xs text-muted">Merchant amount</dt>
          <dd className="mt-1">
            <CurrencyAmount amount={Number(order.merchant_amount)} currency={order.currency} size={16} />
          </dd>
        </div>
      </dl>

      <h2 className="mt-10 font-heading text-lg font-semibold">Items</h2>
      <ul className="mt-4 space-y-2">
        {order.items.map((item) => (
          <li
            key={item.id}
            className="flex justify-between rounded-xl border border-border bg-card/40 px-4 py-3 text-sm"
          >
            <span>{item.product_name} × {item.quantity}</span>
            <CurrencyAmount amount={Number(item.line_total)} currency={order.currency} size={16} />
          </li>
        ))}
      </ul>

      {order.status === "paid" && (
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <FulfillmentActions orderId={order.id} currentStatus={order.fulfillment_status} />
          {order.fulfillment_status && (
            <StatusBadge status={order.fulfillment_status} />
          )}
        </div>
      )}

      {order.status === "paid" && (
        <aside className="mt-10 max-w-md rounded-2xl border border-border bg-card/40 p-6">
          <h2 className="font-heading text-lg font-semibold">Fulfillment timeline</h2>
          <div className="mt-4">
            <OrderTimeline
              status={order.status}
              fulfillmentStatus={order.fulfillment_status}
              createdAt={order.created_at}
              paidAt={order.paid_at}
              shippedAt={order.shipped_at}
              deliveredAt={order.delivered_at}
            />
          </div>
        </aside>
      )}

      {order.status === "pending_payment" && (
        <div className="mt-8">
          <CancelOrderButton orderId={order.id} scope="merchant" />
        </div>
      )}

      {order.invoice && (
        <div className="mt-8">
          <Link
            href={`/merchant/invoices/${order.invoice.id}`}
            className="text-gold hover:text-gold-secondary"
          >
            Invoice {order.invoice.invoice_number} →
          </Link>
        </div>
      )}
    </div>
  );
}
