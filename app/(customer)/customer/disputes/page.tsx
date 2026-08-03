import Link from "next/link";
import { Scale } from "lucide-react";
import { getCurrentProfile } from "@/modules/users/repository";
import { getCustomerDisputes } from "@/modules/disputes/repository";
import { openDisputeFormAction } from "@/modules/disputes/actions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSection,
  dashboardFilterControlClass,
} from "@/components/dashboard";

export default async function CustomerDisputesPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const disputes = await getCustomerDisputes(profile.id);

  return (
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title="Disputes"
        description="Open a dispute or track an existing claim."
      />

      <DashboardSection title="Open dispute" level="h3">
        <DashboardCard className="max-w-lg">
          <form action={openDisputeFormAction} className="space-y-4">
            <input
              name="orderId"
              placeholder="Order ID"
              required
              className={`${dashboardFilterControlClass} w-full`}
            />
            <textarea
              name="reason"
              placeholder="Describe the issue (min 10 characters)"
              required
              minLength={10}
              rows={4}
              className="w-full rounded-xl border border-border bg-surface/60 px-3 py-2.5 text-sm text-white placeholder:text-muted focus:border-gold/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
            />
            <Button type="submit">Submit dispute</Button>
          </form>
        </DashboardCard>
      </DashboardSection>

      <DashboardSection title="Your disputes" level="h3">
        {disputes.length === 0 ? (
          <DashboardEmptyState
            icon={<Scale className="h-5 w-5" aria-hidden />}
            title="No disputes"
            description="Claims you raise against an order will be tracked here."
          />
        ) : (
          <ul className="space-y-3">
            {disputes.map((d) => (
              <DashboardCard as="li" key={d.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Link
                    href={`/customer/disputes/${d.id}`}
                    className="font-medium text-gold hover:underline"
                  >
                    View dispute →
                  </Link>
                  <StatusBadge status={d.status} />
                </div>
                <p className="mt-2 text-white">{d.reason}</p>
                <p className="mt-1 text-xs text-muted">{new Date(d.created_at).toLocaleString()}</p>
              </DashboardCard>
            ))}
          </ul>
        )}
      </DashboardSection>
    </div>
  );
}
