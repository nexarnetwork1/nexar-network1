import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";
import { getCurrentProfile } from "@/modules/users/repository";
import { getOrderById } from "@/modules/orders/repository";
import { getInvoicePaymentOptions } from "@/modules/payments/repository";
import { PayNowButton } from "@/components/payments/PayNowButton";
import { CancelOrderButton } from "@/components/orders/CancelOrderButton";
import { OrderConfirmationBanner } from "@/components/orders/OrderConfirmationBanner";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { Button } from "@/components/ui/Button";
import { CurrencyAmount } from "@/components/payments/CurrencyAmount";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  DashboardCard,
  DashboardSection,
  DashboardTable,
  DashboardTableBody,
  DashboardTableCell,
  DashboardTableHead,
  DashboardTableHeader,
  DashboardTableRow,
} from "@/components/dashboard";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ confirmed?: string }>;
};

export default async function CustomerOrderDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { confirmed } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) redirect(commerceAuthHref({ auth: "signin", redirect: `/customer/orders/${id}` }));

  const order = await getOrderById(id);
  if (!order || order.customer_id !== profile.id) notFound();

  const invoice = order.invoice;
  const paymentOptions = await getInvoicePaymentOptions(order.store_id);

  return (
    <div>
      <Link href="/customer/orders" className="text-sm text-muted hover:text-gold">
        ← Back to orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <h1 className="font-heading text-3xl font-semibold">Order details</h1>
        <StatusBadge status={order.status} />
        {order.status === "paid" && (
          <StatusBadge status={order.fulfillment_status ?? "pending"} />
        )}
      </div>

      <OrderConfirmationBanner
        status={order.status}
        invoiceNumber={invoice?.invoice_number}
        confirmed={confirmed === "1"}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-card/60 p-4">
              <dt className="text-xs text-muted">Store</dt>
              <dd className="mt-1 font-medium">{order.store.name}</dd>
            </div>
            <div className="rounded-xl border border-border bg-card/60 p-4">
              <dt className="text-xs text-muted">Subtotal</dt>
              <dd className="mt-1 font-medium">
                <CurrencyAmount amount={Number(order.subtotal)} currency={order.currency} size={16} />
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-card/60 p-4">
              <dt className="text-xs text-muted">Created</dt>
              <dd className="mt-1">{new Date(order.created_at).toLocaleString()}</dd>
            </div>
            {invoice && (
              <div className="rounded-xl border border-border bg-card/60 p-4">
                <dt className="text-xs text-muted">Invoice</dt>
                <dd className="mt-1 font-mono text-sm">{invoice.invoice_number}</dd>
              </div>
            )}
          </dl>

          <DashboardSection title="Items" level="h3" className="mt-10">
            <DashboardCard flush className="overflow-hidden">
              <DashboardTable caption="Order items" minWidth="34rem">
                <DashboardTableHead>
                  <DashboardTableRow>
                    <DashboardTableHeader>Product</DashboardTableHeader>
                    <DashboardTableHeader>Qty</DashboardTableHeader>
                    <DashboardTableHeader>Unit price</DashboardTableHeader>
                    <DashboardTableHeader>Total</DashboardTableHeader>
                  </DashboardTableRow>
                </DashboardTableHead>
                <DashboardTableBody>
                  {order.items.map((item) => (
                    <DashboardTableRow key={item.id}>
                      <DashboardTableCell wrap>{item.product_name}</DashboardTableCell>
                      <DashboardTableCell>{item.quantity}</DashboardTableCell>
                      <DashboardTableCell>
                        <CurrencyAmount amount={Number(item.unit_price)} currency={order.currency} size={16} />
                      </DashboardTableCell>
                      <DashboardTableCell>
                        <CurrencyAmount amount={Number(item.line_total)} currency={order.currency} size={16} />
                      </DashboardTableCell>
                    </DashboardTableRow>
                  ))}
                </DashboardTableBody>
              </DashboardTable>
            </DashboardCard>
          </DashboardSection>

          {invoice && (
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/customer/invoices/${invoice.id}`}>
                <Button variant="secondary">View invoice</Button>
              </Link>
              {order.status === "pending_payment" && (
                <>
                  <PayNowButton
                    invoiceId={invoice.id}
                    invoiceNumber={invoice.invoice_number}
                    storeName={order.store.name}
                    amountUsd={Number(invoice.amount)}
                    paymentOptions={paymentOptions}
                  />
                  <CancelOrderButton orderId={order.id} />
                </>
              )}
              <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">Download PDF</Button>
              </a>
            </div>
          )}
        </div>

        <aside className="rounded-2xl border border-border bg-card/60 p-6">
          <h2 className="font-heading text-lg font-semibold">Order timeline</h2>
          <div className="mt-6">
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
      </div>
    </div>
  );
}
