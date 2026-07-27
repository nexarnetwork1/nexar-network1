import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/modules/users/repository";
import { PayNowButton } from "@/components/payments/PayNowButton";
import { getInvoicePaymentOptions } from "@/modules/payments/repository";

type Props = { params: Promise<{ token: string }> };

export default async function PublicInvoicePayPage({ params }: Props) {
  const { token } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("resolve_invoice_share_token", {
    p_token: token,
  });

  if (error || !data) notFound();

  const invoice = data as {
    invoice_id: string;
    invoice_number: string;
    amount: number;
    currency: string;
    description: string | null;
    store_name: string;
    store_id: string;
    status: string;
  };

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(`/login?redirect=/pay/i/${token}`);
  }

  if (profile.role !== "customer") {
    redirect("/login");
  }

  const paymentOptions = await getInvoicePaymentOptions(invoice.store_id);

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <h1 className="font-heading text-3xl font-semibold">Pay invoice</h1>
      <p className="mt-2 text-muted">{invoice.store_name}</p>

      <dl className="mt-8 space-y-3 rounded-2xl border border-border bg-card/40 p-6 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Invoice</dt>
          <dd className="font-mono">{invoice.invoice_number}</dd>
        </div>
        {invoice.description && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted shrink-0">Description</dt>
            <dd className="text-right">{invoice.description}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted">Amount</dt>
          <dd className="font-heading text-lg text-gold">
            {invoice.currency} {Number(invoice.amount).toFixed(2)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Status</dt>
          <dd className="capitalize">{invoice.status}</dd>
        </div>
      </dl>

      {["pending", "draft"].includes(invoice.status) && (
        <div className="mt-8">
          <PayNowButton
            invoiceId={invoice.invoice_id}
            invoiceNumber={invoice.invoice_number}
            storeName={invoice.store_name}
            amountUsd={Number(invoice.amount)}
            paymentOptions={paymentOptions}
          />
        </div>
      )}

      <Link href="/customer/invoices" className="mt-8 inline-block text-sm text-gold hover:underline">
        ← All invoices
      </Link>
    </div>
  );
}
