import { requireRole } from "@/modules/users/repository";
import { getPendingWithdrawals } from "@/modules/withdrawals/repository";
import { adminReviewWithdrawalAction } from "@/modules/withdrawals/actions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";

export default async function AdminWithdrawalsPage() {
  await requireRole(["admin"]);
  const withdrawals = await getPendingWithdrawals();

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">Withdrawals</h1>
      <p className="mt-2 text-muted">Review merchant withdrawal requests.</p>
      <div className="mt-8 space-y-4">
        {withdrawals.map((w) => (
          <div key={w.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-6">
            <div>
              <p className="font-semibold text-white">${Number(w.amount).toFixed(2)} {w.currency}</p>
              <p className="font-mono text-xs text-muted">{w.wallet_address}</p>
              <StatusBadge status={w.status} />
            </div>
            <div className="flex gap-2">
              <form action={async () => {
                "use server";
                await adminReviewWithdrawalAction({ withdrawalId: w.id, approve: true });
              }}>
                <Button type="submit" size="sm">Approve</Button>
              </form>
              <form action={async () => {
                "use server";
                await adminReviewWithdrawalAction({ withdrawalId: w.id, approve: false, rejectionReason: "Insufficient balance" });
              }}>
                <Button type="submit" size="sm" variant="ghost">Reject</Button>
              </form>
            </div>
          </div>
        ))}
        {withdrawals.length === 0 && <p className="text-muted">No pending withdrawals.</p>}
      </div>
    </div>
  );
}
