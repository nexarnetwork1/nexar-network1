import Link from "next/link";
import { Scale } from "lucide-react";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getStoreDisputes } from "@/modules/disputes/repository";
import { merchantAcceptRefundAction } from "@/modules/disputes/actions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSection,
} from "@/components/dashboard";

export default async function MerchantDisputesPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const store = await getMerchantStore(profile.id);
  if (!store) {
    return (
      <DashboardSection as="div" level="h1" title="Disputes" description="No store found." />
    );
  }
  const disputes = await getStoreDisputes(store.id);

  return (
    <div className="space-y-6">
      <DashboardSection
        as="div"
        level="h1"
        title="Disputes"
        description={`Respond to customer claims for ${store.name}.`}
      />

      {disputes.length === 0 ? (
        <DashboardEmptyState
          icon={<Scale className="h-5 w-5" aria-hidden />}
          title="No disputes"
          description="Claims raised against your orders will appear here."
        />
      ) : (
        <ul className="space-y-4">
          {disputes.map((d) => (
            <DashboardCard as="li" key={d.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link
                  href={`/merchant/disputes/${d.id}`}
                  className="rounded-md font-medium text-gold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                >
                  Open dispute →
                </Link>
                <StatusBadge status={d.status} />
              </div>
              <p className="mt-2 break-words text-white">{d.reason}</p>
              {d.status === "open" && (
                <form
                  action={async () => {
                    "use server";
                    await merchantAcceptRefundAction(d.id);
                  }}
                  className="mt-4"
                >
                  <Button type="submit" size="sm">
                    Accept refund
                  </Button>
                </form>
              )}
            </DashboardCard>
          ))}
        </ul>
      )}
    </div>
  );
}
