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
import { DashboardCard, DashboardSection } from "@/components/dashboard";

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
    <div className="space-y-6">
      <DashboardSection
        as="div"
        level="h1"
        title={<span className="break-all">{invoice.invoice_number}</span>}
        actions={<StatusBadge status={invoice.status} />}
      />

      <DashboardCard className="max-w-2xl">
        <dl className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <dt className="text-muted">Customer</dt>
            <dd className="break-words text-right">
              {invoice.customer.full_name ?? invoice.customer.email}
            </dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <dt className="text-muted">Amount</dt>
            <dd className="font-heading text-xl text-gold">
              <CurrencyAmount amount={Number(invoice.amount)} currency={invoice.currency} size={20} />
            </dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <dt className="text-muted">Order</dt>
            <dd>
              <Link
                href={`/merchant/orders/${invoice.order_id}`}
                className="rounded-md text-gold hover:text-gold-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
              >
                View order
              </Link>
            </dd>
          </div>
        </dl>
      </DashboardCard>

      <InvoiceItemsTable items={invoice.items ?? []} currency={invoice.currency} />

      {payUrl && <InvoiceShareLink payUrl={payUrl} />}

      <div>
        <a
          href={`/api/invoices/${invoice.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center rounded-md text-sm text-gold hover:text-gold-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
        >
          Download PDF
        </a>
      </div>
    </div>
  );
}
