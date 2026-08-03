import Link from "next/link";
import { redirect } from "next/navigation";
import { Receipt } from "lucide-react";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";
import { getCurrentProfile } from "@/modules/users/repository";
import { getCustomerInvoices } from "@/modules/invoices/repository";
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

export default async function CustomerInvoicesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect(commerceAuthHref({ auth: "signin", redirect: "/customer/invoices" }));

  const invoices = await getCustomerInvoices(profile.id);

  return (
    <div className="space-y-6">
      <DashboardSection as="div" level="h1" title="Invoices" description="Your payment invoices" />

      <DashboardCard flush className="overflow-hidden">
        <DashboardTable caption="Your invoices" minWidth="42rem">
          <DashboardTableHead>
            <DashboardTableRow>
              <DashboardTableHeader>Invoice</DashboardTableHeader>
              <DashboardTableHeader>Amount</DashboardTableHeader>
              <DashboardTableHeader>Status</DashboardTableHeader>
              <DashboardTableHeader hideBelow="sm">Issued</DashboardTableHeader>
              <DashboardTableHeader align="right">Actions</DashboardTableHeader>
            </DashboardTableRow>
          </DashboardTableHead>
          <DashboardTableBody>
            {invoices.length === 0 ? (
              <DashboardTableEmpty colSpan={5}>
                <DashboardEmptyState
                  inset
                  icon={<Receipt className="h-5 w-5" aria-hidden />}
                  title="No invoices yet"
                  description="Invoices issued to you by merchants will show up here."
                />
              </DashboardTableEmpty>
            ) : (
              invoices.map((invoice) => (
                <DashboardTableRow key={invoice.id} interactive>
                  <DashboardTableCell>
                    <Link
                      href={`/customer/invoices/${invoice.id}`}
                      className="font-mono text-gold hover:text-gold-secondary"
                    >
                      {invoice.invoice_number}
                    </Link>
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
                      className="text-muted hover:text-gold"
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
