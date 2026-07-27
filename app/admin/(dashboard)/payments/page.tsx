import { getAllPaymentSessions, getAllSettlements } from "@/modules/platform/repository";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function AdminPaymentsPage() {
  const [sessions, settlements] = await Promise.all([
    getAllPaymentSessions(),
    getAllSettlements(),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-400">Payments</h1>
      <p className="mt-2 text-zinc-400">Payment sessions and settlements</p>

      <h2 className="mt-10 text-lg font-semibold">Recent sessions</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-zinc-900 text-left text-zinc-400">
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-b border-white/5">
                <td className="px-4 py-3 font-mono text-xs">
                  {(s.invoice as { invoice_number?: string })?.invoice_number ?? "—"}
                </td>
                <td className="px-4 py-3">{s.method}</td>
                <td className="px-4 py-3">
                  {Number(s.amount).toFixed(6)} {s.currency}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={s.status} />
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {new Date(s.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-lg font-semibold">Settlements</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-zinc-900 text-left text-zinc-400">
              <th className="px-4 py-3">Gross</th>
              <th className="px-4 py-3">Platform fee</th>
              <th className="px-4 py-3">Merchant</th>
              <th className="px-4 py-3">Rate</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {settlements.map((s) => (
              <tr key={s.id} className="border-b border-white/5">
                <td className="px-4 py-3">${Number(s.gross_amount).toFixed(2)}</td>
                <td className="px-4 py-3 text-yellow-400">
                  ${Number(s.platform_fee).toFixed(2)}
                </td>
                <td className="px-4 py-3">${Number(s.merchant_amount).toFixed(2)}</td>
                <td className="px-4 py-3">{(Number(s.fee_rate_applied) * 100).toFixed(2)}%</td>
                <td className="px-4 py-3">
                  <StatusBadge status={s.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
