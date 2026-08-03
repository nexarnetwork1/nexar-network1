import Link from "next/link";
import { FileText } from "lucide-react";
import { requireSuperAdmin } from "@/modules/users/repository";
import { getSettlementReports } from "@/modules/settlement-reports/repository";
import { UsdAmount } from "@/components/payments/CurrencyAmount";
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

const exportLinkClass =
  "inline-flex min-h-11 items-center rounded-lg px-2 text-gold transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50";

export default async function AdminSettlementReportsPage() {
  await requireSuperAdmin();
  const reports = await getSettlementReports({ limit: 30 });

  return (
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title="Settlement Reports"
        description="Daily, weekly, and monthly revenue summaries."
      />

      <DashboardCard flush className="overflow-hidden">
        <DashboardTable caption="Settlement reports and exports" minWidth="44rem">
          <DashboardTableHead>
            <DashboardTableRow>
              <DashboardTableHeader>Period</DashboardTableHeader>
              <DashboardTableHeader>Gross</DashboardTableHeader>
              <DashboardTableHeader hideBelow="md">Fees</DashboardTableHeader>
              <DashboardTableHeader>Net</DashboardTableHeader>
              <DashboardTableHeader align="right">Export</DashboardTableHeader>
            </DashboardTableRow>
          </DashboardTableHead>
          <DashboardTableBody>
            {reports.length === 0 ? (
              <DashboardTableEmpty colSpan={5}>
                <DashboardEmptyState
                  inset
                  icon={<FileText className="h-5 w-5" aria-hidden />}
                  title="No settlement reports yet"
                  description="Generated revenue summaries will appear here ready to export."
                />
              </DashboardTableEmpty>
            ) : (
              reports.map((r) => (
                <DashboardTableRow key={r.id} interactive>
                  <DashboardTableCell className="capitalize">
                    {r.period_type} · {r.period_start}
                  </DashboardTableCell>
                  <DashboardTableCell>
                    <UsdAmount amount={r.metrics.gross_revenue} size={16} />
                  </DashboardTableCell>
                  <DashboardTableCell hideBelow="md">
                    <UsdAmount amount={r.metrics.platform_fees} size={16} />
                  </DashboardTableCell>
                  <DashboardTableCell>
                    <UsdAmount amount={r.metrics.net_revenue} size={16} />
                  </DashboardTableCell>
                  <DashboardTableCell align="right">
                    <span className="inline-flex items-center justify-end gap-1">
                      <Link href={`/api/admin/settlement-reports/${r.id}/csv`} className={exportLinkClass}>
                        CSV
                      </Link>
                      <Link href={`/api/admin/settlement-reports/${r.id}/excel`} className={exportLinkClass}>
                        Excel
                      </Link>
                      <Link href={`/api/admin/settlement-reports/${r.id}/pdf`} className={exportLinkClass}>
                        PDF
                      </Link>
                    </span>
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
