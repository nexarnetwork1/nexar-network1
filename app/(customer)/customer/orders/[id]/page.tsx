import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { getOrderById } from "@/modules/orders/repository";
import { getInvoicePaymentOptions } from "@/modules/payments/repository";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PayNowButton } from "@/components/payments/PayNowButton";
import { CancelOrderButton } from "@/components/orders/CancelOrderButton";
import { Button } from "@/components/ui/Button";
import { CurrencyAmount } from "@/components/payments/CurrencyAmount";

type Props = { params: Promise<{ id: string }> };

export default async function CustomerOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

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
      </div>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <dt className="text-xs text-muted">Store</dt>
          <dd className="mt-1 font-medium">{order.store.name}</dd>
        </div>
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <dt className="text-xs text-muted">Subtotal</dt>
          <dd className="mt-1 font-medium">
            <CurrencyAmount amount={Number(order.subtotal)} currency={order.currency} size={16} />
          </dd>
        </div>
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <dt className="text-xs text-muted">Created</dt>
          <dd className="mt-1">{new Date(order.created_at).toLocaleString()}</dd>
        </div>
        {invoice && (
          <div className="rounded-xl border border-border bg-card/40 p-4">
            <dt className="text-xs text-muted">Invoice</dt>
            <dd className="mt-1 font-mono text-sm">{invoice.invoice_number}</dd>
          </div>
        )}
      </dl>

      <h2 className="mt-10 font-heading text-lg font-semibold">Items</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface/50 text-left text-muted">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Unit price</th>
              <th className="px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-border/50">
                <td className="px-4 py-3">{item.product_name}</td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3">
                  <CurrencyAmount amount={Number(item.unit_price)} currency={order.currency} size={16} />
                </td>
                <td className="px-4 py-3">
                  <CurrencyAmount amount={Number(item.line_total)} currency={order.currency} size={16} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invoice && (
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/customer/invoices/${invoice.id}`}>
            <Button variant="secondary">View invoice</Button>
          </Link>
          {order.status === "pending_payment" && invoice && (
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
  );
}
