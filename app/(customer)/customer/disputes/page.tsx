import Link from "next/link";
import { getCurrentProfile } from "@/modules/users/repository";
import { getCustomerDisputes } from "@/modules/disputes/repository";
import { openDisputeFormAction } from "@/modules/disputes/actions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";

export default async function CustomerDisputesPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const disputes = await getCustomerDisputes(profile.id);

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">Disputes</h1>
      <p className="mt-2 text-muted">Open a dispute or track an existing claim.</p>

      <form action={openDisputeFormAction} className="mt-8 max-w-lg space-y-4 rounded-xl border border-border p-6">
        <h2 className="font-semibold text-white">Open dispute</h2>
        <input name="orderId" placeholder="Order ID" required className="w-full rounded-lg border border-border bg-surface px-3 py-2" />
        <textarea name="reason" placeholder="Describe the issue (min 10 characters)" required minLength={10} className="w-full rounded-lg border border-border bg-surface px-3 py-2" rows={4} />
        <Button type="submit">Submit dispute</Button>
      </form>

      <div className="mt-8 space-y-3">
        {disputes.map((d) => (
          <div key={d.id} className="rounded-xl border border-border p-4">
            <Link href={`/customer/disputes/${d.id}`} className="font-medium text-gold hover:underline">
              View dispute →
            </Link>
            <StatusBadge status={d.status} />
            <p className="mt-2 text-white">{d.reason}</p>
            <p className="mt-1 text-xs text-muted">{new Date(d.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
