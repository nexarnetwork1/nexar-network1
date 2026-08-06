import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { getInvoiceById } from "@/modules/invoices/repository";
import { getInvoicePaymentOptions } from "@/modules/payments/repository";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PayNowButton } from "@/components/payments/PayNowButton";
import { InvoiceItemsTable } from "@/components/invoices/InvoiceItemsTable";
import { Button } from "@/components/ui/Button";
import { CurrencyAmount } from "@/components/payments/CurrencyAmount";
import { DashboardActions, DashboardCard, DashboardSection } from "@/components/dashboard";

type Props = { params: Promise<{ id: string }> };

export default async function CustomerInvoiceDetailPage({ params }: Props) {
  const { id } = await params;
  const profile = await getCurrentProfile();
 if (!profile) {
  redirect("/login?redirect=" + encodeURIComponent(`/customer/invoices/${id}`));
}

  const invoice = await getInvoiceById(id);
  if (!invoice || invoice.customer_id !== profile.id) notFound();

  const paymentOptions = await getInvoicePaymentOptions(invoice.store_id);

  return (
    <div className="space-y-6">
      <DashboardSection
        as="div"
        level="h1"
        title={<span className="break-all">{invoice.invoice_number}</span>}
        actions={<StatusBadge status={invoice.status} />}
      />

      <DashboardCard className="max-w-2xl">
        <dl className="space-y-4 text-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <dt className="text-muted">Store</dt>
            <dd className="min-w-0 break-words text-right text-white">{invoice.store.name}</dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <dt className="text-muted">Amount</dt>
            <dd className="min-w-0 font-heading text-xl text-gold">
              <CurrencyAmount amount={Number(invoice.amount)} currency={invoice.currency} size={20} />
            </dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <dt className="text-muted">Issued</dt>
            <dd className="min-w-0 break-words text-right text-white">
              {new Date(invoice.issued_at).toLocaleString()}
            </dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <dt className="text-muted">Due</dt>
            <dd className="min-w-0 break-words text-right text-white">
              {new Date(invoice.due_at).toLocaleString()}
            </dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <dt className="text-muted">Order</dt>
            <dd className="min-w-0">
              <Link
                href={`/customer/orders/${invoice.order_id}`}
                className="rounded text-gold hover:text-gold-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
              >
                View order
              </Link>
            </dd>
          </div>
        </dl>
      </DashboardCard>

      <InvoiceItemsTable items={invoice.items ?? []} currency={invoice.currency} />

      <DashboardActions>
        <a
          href={`/api/invoices/${invoice.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
        >
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
      </DashboardActions>
    </div>
  );
}
