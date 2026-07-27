import Link from "next/link";
import { requireSuperAdmin } from "@/modules/users/repository";
import { getSettlementReports } from "@/modules/settlement-reports/repository";
import { UsdAmount } from "@/components/payments/CurrencyAmount";

export default async function AdminSettlementReportsPage() {
  await requireSuperAdmin();
  const reports = await getSettlementReports({ limit: 30 });

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">Settlement Reports</h1>
      <p className="mt-2 text-muted">Daily, weekly, and monthly revenue summaries.</p>
      <div className="mt-8 overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-surface/60 text-left text-muted">
            <tr>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Gross</th>
              <th className="px-4 py-3">Fees</th>
              <th className="px-4 py-3">Net</th>
              <th className="px-4 py-3">Export</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3 capitalize">{r.period_type} · {r.period_start}</td>
                <td className="px-4 py-3"><UsdAmount amount={r.metrics.gross_revenue} size={16} /></td>
                <td className="px-4 py-3"><UsdAmount amount={r.metrics.platform_fees} size={16} /></td>
                <td className="px-4 py-3"><UsdAmount amount={r.metrics.net_revenue} size={16} /></td>
                <td className="px-4 py-3 space-x-2">
                  <Link href={`/api/admin/settlement-reports/${r.id}/csv`} className="text-gold hover:underline">CSV</Link>
                  <Link href={`/api/admin/settlement-reports/${r.id}/excel`} className="text-gold hover:underline">Excel</Link>
                  <Link href={`/api/admin/settlement-reports/${r.id}/pdf`} className="text-gold hover:underline">PDF</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
