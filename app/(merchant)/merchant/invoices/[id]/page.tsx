import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getInvoiceById } from "@/modules/invoices/repository";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { InvoiceItemsTable } from "@/components/invoices/InvoiceItemsTable";
import { InvoiceShareLink } from "@/components/merchant/InvoiceShareLink";
import { buildInvoicePayUrl } from "@/lib/qr/payload";
import { CurrencyAmount } from "@/components/payments/CurrencyAmount";

type Props = { params: Promise<{ id: string }> };

export default async function MerchantInvoiceDetailPage({ params }: Props) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect(commerceAuthHref({ auth: "signin", redirect: `/merchant/invoices/${id}` }));

  const store = await getMerchantStore(profile.id);
  if (!store) redirect("/merchant");

  const invoice = await getInvoiceById(id);
  if (!invoice || invoice.store_id !== store.id) notFound();

  const payUrl =
    invoice.share_token && ["pending", "draft"].includes(invoice.status)
      ? buildInvoicePayUrl(invoice.share_token)
      : null;

  return (
    <div>
      <Link href="/merchant/invoices" className="text-sm text-muted hover:text-gold">
        ← Back to invoices
      </Link>

      <div className="mt-4 flex items-center gap-4">
        <h1 className="font-heading text-3xl font-semibold">{invoice.invoice_number}</h1>
        <StatusBadge status={invoice.status} />
      </div>

      <dl className="mt-8 max-w-2xl space-y-4 rounded-2xl border border-border bg-card/40 p-6">
        <div className="flex justify-between">
          <dt className="text-muted">Customer</dt>
          <dd>{invoice.customer.full_name ?? invoice.customer.email}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Amount</dt>
          <dd className="font-heading text-xl text-gold">
            <CurrencyAmount amount={Number(invoice.amount)} currency={invoice.currency} size={20} />
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Order</dt>
          <dd>
            <Link
              href={`/merchant/orders/${invoice.order_id}`}
              className="text-gold hover:text-gold-secondary"
            >
              View order
            </Link>
          </dd>
        </div>
      </dl>

      <InvoiceItemsTable items={invoice.items ?? []} currency={invoice.currency} />

      {payUrl && <InvoiceShareLink payUrl={payUrl} />}

      <a
        href={`/api/invoices/${invoice.id}/pdf`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-block text-sm text-gold hover:text-gold-secondary"
      >
        Download PDF
      </a>
    </div>
  );
}
