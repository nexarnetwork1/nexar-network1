import { FileText } from "lucide-react";
import { getAllInvoices } from "@/modules/invoices/repository";
import { requireSuperAdmin } from "@/modules/users/repository";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CurrencyAmount } from "@/components/payments/CurrencyAmount";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSection,
  DashboardTable,
  DashboardTableBody,
  DashboardTableCell,
  DashboardTableEmpty,
  DashboardTableHead,
  DashboardTableHeader,
  DashboardTableRow,
} from "@/components/dashboard";

export default async function AdminInvoicesPage() {
  await requireSuperAdmin();

  const invoices = await getAllInvoices();

  return (
    <div className="space-y-6">
      <DashboardSection as="div" level="h1" title="Invoices" description="All platform invoices" />

      <DashboardCard flush className="overflow-hidden">
        <DashboardTable caption="All platform invoices" minWidth="44rem">
          <DashboardTableHead>
            <DashboardTableRow>
              <DashboardTableHeader>Invoice</DashboardTableHeader>
              <DashboardTableHeader>Amount</DashboardTableHeader>
              <DashboardTableHeader>Status</DashboardTableHeader>
              <DashboardTableHeader hideBelow="sm">Issued</DashboardTableHeader>
              <DashboardTableHeader align="right">PDF</DashboardTableHeader>
            </DashboardTableRow>
          </DashboardTableHead>
          <DashboardTableBody>
            {invoices.length === 0 ? (
              <DashboardTableEmpty colSpan={5}>
                <DashboardEmptyState
                  inset
                  icon={<FileText className="h-5 w-5" aria-hidden />}
                  title="No invoices yet"
                  description="Invoices issued by merchants across the platform will appear here."
                />
              </DashboardTableEmpty>
            ) : (
              invoices.map((invoice) => (
                <DashboardTableRow key={invoice.id} interactive>
                  <DashboardTableCell className="font-mono text-gold">
                    {invoice.invoice_number}
                  </DashboardTableCell>
                  <DashboardTableCell>
                    <CurrencyAmount amount={Number(invoice.amount)} currency={invoice.currency} size={16} />
                  </DashboardTableCell>
                  <DashboardTableCell>
                    <StatusBadge status={invoice.status} />
                  </DashboardTableCell>
                  <DashboardTableCell hideBelow="sm" className="text-muted">
                    {new Date(invoice.issued_at).toLocaleDateString()}
                  </DashboardTableCell>
                  <DashboardTableCell align="right">
                    <a
                      href={`/api/invoices/${invoice.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center rounded-lg px-2 text-muted transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                    >
                      PDF
                    </a>
                  </DashboardTableCell>
                </DashboardTableRow>
              ))
            )}
          </DashboardTableBody>
        </DashboardTable>
      </DashboardCard>
    </div>
  );
}
