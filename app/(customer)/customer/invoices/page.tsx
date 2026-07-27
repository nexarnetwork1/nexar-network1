import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { getCustomerInvoices } from "@/modules/invoices/repository";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function CustomerInvoicesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const invoices = await getCustomerInvoices(profile.id);

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold">Invoices</h1>
      <p className="mt-2 text-muted">Your payment invoices</p>

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
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-border/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/customer/invoices/${invoice.id}`}
                      className="font-mono text-gold hover:text-gold-secondary"
                    >
                      {invoice.invoice_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {invoice.currency} {Number(invoice.amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(invoice.issued_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/api/invoices/${invoice.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted hover:text-gold"
                    >
                      PDF
                    </a>
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
