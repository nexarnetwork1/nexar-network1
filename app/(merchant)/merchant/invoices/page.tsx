import Link from "next/link";
import { redirect } from "next/navigation";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getMerchantInvoices } from "@/modules/invoices/repository";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { CurrencyAmount } from "@/components/payments/CurrencyAmount";

export default async function MerchantInvoicesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect(commerceAuthHref({ auth: "signin", redirect: "/merchant/invoices" }));

  const store = await getMerchantStore(profile.id);
  if (!store) redirect("/merchant");

  const invoices = await getMerchantInvoices(store.id);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Invoices</h1>
          <p className="mt-2 text-muted">Invoices for {store.name}</p>
        </div>
        <Link href="/merchant/invoices/new">
          <Button>New payment request</Button>
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-border bg-card/40 p-12 text-center text-muted">
          No invoices yet.
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50 text-left text-muted">
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Issued</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-border/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/merchant/invoices/${invoice.id}`}
                      className="font-mono text-gold hover:text-gold-secondary"
                    >
                      {invoice.invoice_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <CurrencyAmount amount={Number(invoice.amount)} currency={invoice.currency} size={16} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(invoice.issued_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
