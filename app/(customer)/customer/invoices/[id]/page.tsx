import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { getInvoiceById } from "@/modules/invoices/repository";
import { getInvoicePaymentOptions } from "@/modules/payments/repository";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PayNowButton } from "@/components/payments/PayNowButton";
import { InvoiceItemsTable } from "@/components/invoices/InvoiceItemsTable";
import { Button } from "@/components/ui/Button";

type Props = { params: Promise<{ id: string }> };

export default async function CustomerInvoiceDetailPage({ params }: Props) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const invoice = await getInvoiceById(id);
  if (!invoice || invoice.customer_id !== profile.id) notFound();

  const paymentOptions = await getInvoicePaymentOptions(invoice.store_id);

  return (
    <div>
      <Link href="/customer/invoices" className="text-sm text-muted hover:text-gold">
        ← Back to invoices
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <h1 className="font-heading text-3xl font-semibold">{invoice.invoice_number}</h1>
        <StatusBadge status={invoice.status} />
      </div>

      <dl className="mt-8 max-w-2xl space-y-4 rounded-2xl border border-border bg-card/40 p-6">
        <div className="flex justify-between">
          <dt className="text-muted">Store</dt>
          <dd>{invoice.store.name}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Amount</dt>
          <dd className="font-heading text-xl text-gold">
            {invoice.currency} {Number(invoice.amount).toFixed(2)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Issued</dt>
          <dd>{new Date(invoice.issued_at).toLocaleString()}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Due</dt>
          <dd>{new Date(invoice.due_at).toLocaleString()}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Order</dt>
          <dd>
            <Link
              href={`/customer/orders/${invoice.order_id}`}
              className="text-gold hover:text-gold-secondary"
            >
              View order
            </Link>
          </dd>
        </div>
      </dl>

      <InvoiceItemsTable items={invoice.items ?? []} currency={invoice.currency} />

      <div className="mt-8 flex gap-3">
        <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary">Download PDF</Button>
        </a>
        {invoice.status === "pending" && (
          <PayNowButton
            invoiceId={invoice.id}
            invoiceNumber={invoice.invoice_number}
            storeName={invoice.store.name}
            amountUsd={Number(invoice.amount)}
            paymentOptions={paymentOptions}
          />
        )}
      </div>
    </div>
  );
}
