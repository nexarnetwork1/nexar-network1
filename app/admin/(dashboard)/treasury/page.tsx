import { getTreasurySummary } from "@/modules/platform/repository";
import { getPlatformSettings } from "@/modules/platform/repository";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { ExportButton } from "@/components/admin/ExportButton";
import { formatDateTime } from "@/utils/format";

export default async function AdminTreasuryPage() {
  const [summary, settings] = await Promise.all([
    getTreasurySummary(),
    getPlatformSettings(),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-yellow-400">Treasury wallet</h1>
          <p className="mt-2 text-zinc-400">
            Platform fee collection — address and transaction history only. Private keys are never exposed.
          </p>
        </div>
        <ExportButton resource="treasury" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard
          label="Treasury address"
          value={summary.address ? `${summary.address.slice(0, 10)}…${summary.address.slice(-8)}` : "Not configured"}
          hint={summary.address ?? undefined}
        />
        <AdminStatCard label="Total platform fees" value={`$${summary.totalFees.toFixed(2)}`} tone="warning" />
        <AdminStatCard label="Ledger entries" value={summary.transactions.length} />
      </div>

      {settings?.treasury_wallet_address && (
        <p className="mt-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-sm text-zinc-300">
          Configured via platform settings. Update in{" "}
          <a href="/admin/platform-fees" className="text-yellow-400 hover:underline">
            Platform Fees
          </a>
          .
        </p>
      )}

      <h2 className="mt-10 text-lg font-semibold">Fee collection transactions</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-zinc-900 text-left text-zinc-400">
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Currency</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Tx hash</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {summary.transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-white/5">
                <td className="px-4 py-3 capitalize">{tx.tx_type.replace("_", " ")}</td>
                <td className="px-4 py-3">${Number(tx.amount).toFixed(2)}</td>
                <td className="px-4 py-3">{tx.currency}</td>
                <td className="px-4 py-3 capitalize">{tx.status}</td>
                <td className="max-w-[100px] truncate px-4 py-3 font-mono text-xs">
                  {tx.tx_hash ?? "—"}
                </td>
                <td className="px-4 py-3 text-zinc-400">{formatDateTime(tx.created_at)}</td>
              </tr>
            ))}
            {summary.transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  No treasury transactions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
