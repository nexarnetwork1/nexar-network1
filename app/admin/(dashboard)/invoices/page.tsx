import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { getAllInvoices } from "@/modules/invoices/repository";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function AdminInvoicesPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/login");

  const invoices = await getAllInvoices();

  return (
    <div>
      <Link href="/admin/dashboard" className="text-sm text-muted hover:text-yellow-400">
        ← Dashboard
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-yellow-400">Invoices</h1>
      <p className="mt-2 text-zinc-400">All platform invoices</p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-zinc-900 text-left text-zinc-400">
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Issued</th>
              <th className="px-4 py-3">PDF</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b border-white/5">
                <td className="px-4 py-3 font-mono text-yellow-400/80">
                  {invoice.invoice_number}
                </td>
                <td className="px-4 py-3">
                  {invoice.currency} {Number(invoice.amount).toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={invoice.status} />
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {new Date(invoice.issued_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`/api/invoices/${invoice.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-400 hover:text-yellow-400"
                  >
                    PDF
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
