import Link from "next/link";
import { getAllPaymentSessions, getAllSettlements, getRecentPaymentStatusHistory } from "@/modules/platform/repository";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RetrySettlementsButton } from "@/components/admin/RetrySettlementsButton";
import { ExportButton } from "@/components/admin/ExportButton";
import { formatDateTime } from "@/utils/format";

export default async function AdminPaymentsPage() {
  const [sessions, settlements, statusHistory] = await Promise.all([
    getAllPaymentSessions(),
    getAllSettlements(),
    getRecentPaymentStatusHistory(20),
  ]);

  const failedSettlements = settlements.filter((s) => s.status === "failed");
  const failedPayments = sessions.filter((s) => s.status === "failed");
  const pendingPayments = sessions.filter((s) =>
    ["waiting", "pending", "waiting_confirmation"].includes(s.status)
  );

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-yellow-400">Payments</h1>
          <p className="mt-2 text-zinc-400">
            {sessions.length} sessions · {pendingPayments.length} pending · {failedPayments.length} failed
          </p>
        </div>
        <ExportButton resource="payments" />
      </div>

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

      <h2 className="mt-10 flex flex-wrap items-center gap-4 text-lg font-semibold">
        Settlements
        {failedSettlements.length > 0 && (
          <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-normal text-red-300">
            {failedSettlements.length} failed
          </span>
        )}
        <RetrySettlementsButton />
      </h2>
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
              <tr
                key={s.id}
                className={`border-b border-white/5 ${s.status === "failed" ? "bg-red-950/30" : ""}`}
              >
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

      <h2 className="mt-10 text-lg font-semibold">Status history</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-zinc-900 text-left text-zinc-400">
              <th className="px-4 py-3">From</th>
              <th className="px-4 py-3">To</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">When</th>
            </tr>
          </thead>
          <tbody>
            {statusHistory.map((h) => (
              <tr key={h.id} className="border-b border-white/5">
                <td className="px-4 py-3 capitalize">{h.from_status ?? "—"}</td>
                <td className="px-4 py-3 capitalize">{h.to_status}</td>
                <td className="px-4 py-3 text-zinc-400">{h.reason ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-400">{formatDateTime(h.created_at)}</td>
              </tr>
            ))}
            {statusHistory.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                  No status transitions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
