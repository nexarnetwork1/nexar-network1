import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getMerchantWithdrawals } from "@/modules/withdrawals/repository";
import { requestWithdrawalFormAction } from "@/modules/withdrawals/actions";
import { getHeldEscrowBalance } from "@/modules/escrow/repository";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";

export default async function MerchantWithdrawalsPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const store = await getMerchantStore(profile.id);
  if (!store) return <p className="text-muted">No store found.</p>;

  const [withdrawals, escrowHeld] = await Promise.all([
    getMerchantWithdrawals(profile.id),
    getHeldEscrowBalance(store.id),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">Withdrawals</h1>
      <p className="mt-2 text-muted">Request payout to your wallet. Escrow held: ${escrowHeld.toFixed(2)}</p>

      {escrowHeld > 0 && (
        <p className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
          Withdrawals are blocked while escrow funds are held.
        </p>
      )}

      <form action={requestWithdrawalFormAction} className="mt-8 max-w-md space-y-4 rounded-xl border border-border p-6">
        <input type="hidden" name="storeId" value={store.id} />
        <input name="amount" type="number" step="0.01" min="1" placeholder="Amount (USD)" required className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2" disabled={escrowHeld > 0} />
        <input name="walletAddress" placeholder="0x… wallet address" required className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2" disabled={escrowHeld > 0} />
        <Button type="submit" disabled={escrowHeld > 0}>Request withdrawal</Button>
      </form>

      <div className="mt-8 space-y-3">
        {withdrawals.map((w) => (
          <div key={w.id} className="rounded-xl border border-border p-4">
            <StatusBadge status={w.status} />
            <p className="mt-2 text-white">${Number(w.amount).toFixed(2)} → {w.wallet_address.slice(0, 10)}…</p>
          </div>
        ))}
      </div>
    </div>
  );
}
