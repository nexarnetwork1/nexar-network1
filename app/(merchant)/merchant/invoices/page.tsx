import Link from "next/link";
import { redirect } from "next/navigation";
import { Receipt } from "lucide-react";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getMerchantInvoices } from "@/modules/invoices/repository";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
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

export default async function MerchantInvoicesPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
  redirect("/login?redirect=/merchant/invoices");
}

  const store = await getMerchantStore(profile.id);
  if (!store) redirect("/merchant");

  const invoices = await getMerchantInvoices(store.id);

  return (
    <div className="space-y-6">
      <DashboardSection
        as="div"
        level="h1"
        title="Invoices"
        description={`Invoices for ${store.name}`}
        actions={
          <Link href="/merchant/invoices/new">
            <Button>New payment request</Button>
          </Link>
        }
      />

      <DashboardCard flush className="overflow-hidden">
        <DashboardTable caption="Store invoices" minWidth="38rem">
          <DashboardTableHead>
            <DashboardTableRow>
              <DashboardTableHeader>Invoice</DashboardTableHeader>
              <DashboardTableHeader>Amount</DashboardTableHeader>
              <DashboardTableHeader>Status</DashboardTableHeader>
              <DashboardTableHeader hideBelow="sm">Issued</DashboardTableHeader>
            </DashboardTableRow>
          </DashboardTableHead>
          <DashboardTableBody>
            {invoices.length === 0 ? (
              <DashboardTableEmpty colSpan={4}>
                <DashboardEmptyState
                  inset
                  icon={<Receipt className="h-5 w-5" aria-hidden />}
                  title="No invoices yet"
                  description="Payment requests you issue will be listed here."
                  action={
                    <Link href="/merchant/invoices/new">
                      <Button variant="secondary">New payment request</Button>
                    </Link>
                  }
                />
              </DashboardTableEmpty>
            ) : (
              invoices.map((invoice) => (
                <DashboardTableRow key={invoice.id} interactive>
                  <DashboardTableCell>
                    <Link
                      href={`/merchant/invoices/${invoice.id}`}
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
                </DashboardTableRow>
              ))
            )}
          </DashboardTableBody>
        </DashboardTable>
      </DashboardCard>
    </div>
  );
}
