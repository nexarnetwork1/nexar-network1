import Link from "next/link";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getStoreDisputes } from "@/modules/disputes/repository";
import { merchantAcceptRefundAction } from "@/modules/disputes/actions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";

export default async function MerchantDisputesPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const store = await getMerchantStore(profile.id);
  if (!store) return <p className="text-muted">No store found.</p>;
  const disputes = await getStoreDisputes(store.id);

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">Disputes</h1>
      <p className="mt-2 text-muted">Respond to customer claims for {store.name}.</p>
      <div className="mt-8 space-y-4">
        {disputes.map((d) => (
          <div key={d.id} className="rounded-xl border border-border p-6">
            <Link href={`/merchant/disputes/${d.id}`} className="text-gold hover:underline">
              Open dispute →
            </Link>
            <StatusBadge status={d.status} />
            <p className="mt-2 text-white">{d.reason}</p>
            {d.status === "open" && (
              <form action={async () => {
                "use server";
                await merchantAcceptRefundAction(d.id);
              }} className="mt-4">
                <Button type="submit" size="sm">Accept refund</Button>
              </form>
            )}
          </div>
        ))}
        {disputes.length === 0 && <p className="text-muted">No disputes.</p>}
      </div>
    </div>
  );
}
