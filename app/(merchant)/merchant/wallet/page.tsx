import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantWalletSummary } from "@/modules/wallet/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { formatDateTime } from "@/utils/format";

export default async function MerchantWalletPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const [summary, store] = await Promise.all([
    getMerchantWalletSummary(profile.id),
    getMerchantStore(profile.id),
  ]);

  const primaryWallet = summary.wallets.find((w) => w.is_primary) ?? summary.wallets[0];

  return (
    <div>
      <h1 className="font-heading text-3xl text-gold">Wallet</h1>
      <p className="mt-2 text-muted">Payout address and transaction history</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total revenue" value={`$${Number(summary.profile?.total_revenue_usd ?? 0).toFixed(2)}`} />
        <StatCard label="Total orders" value={String(summary.profile?.total_orders ?? 0)} />
        <StatCard label="Payout wallet" value={store?.wallet_address ? "Configured" : "Missing"} />
      </div>

      <section className="mt-10 rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-semibold">Payout address</h2>
        <p className="mt-2 font-mono text-sm">{store?.wallet_address ?? "Not configured"}</p>
        {primaryWallet?.address && primaryWallet.address !== store?.wallet_address && (
          <p className="mt-2 text-sm text-muted">Ledger wallet: {primaryWallet.address}</p>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-semibold">Transactions</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {summary.transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-border/50">
                  <td className="py-3 capitalize">{tx.tx_type.replace("_", " ")}</td>
                  <td className="py-3">${Number(tx.amount).toFixed(2)} {tx.currency}</td>
                  <td className="py-3 capitalize">{tx.status}</td>
                  <td className="py-3 text-muted">{formatDateTime(tx.created_at)}</td>
                </tr>
              ))}
              {summary.transactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted">
                    No wallet transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}
