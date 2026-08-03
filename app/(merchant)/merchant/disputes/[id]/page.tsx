import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { getStoreById } from "@/modules/stores/repository";
import {
  getDisputeById,
  getDisputeMessages,
  getDisputeEvidence,
} from "@/modules/disputes/repository";
import {
  merchantAcceptRefundAction,
  merchantRejectClaimAction,
} from "@/modules/disputes/actions";
import { DisputeThread } from "@/components/disputes/DisputeThread";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import {
  DashboardActions,
  DashboardCard,
  DashboardSection,
} from "@/components/dashboard";

export default async function MerchantDisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const { id } = await params;
  const dispute = await getDisputeById(id);
  if (!dispute) notFound();

  const store = await getStoreById(dispute.store_id);
  if (!store || store.owner_id !== profile.id) notFound();

  const [messages, evidence] = await Promise.all([
    getDisputeMessages(id),
    getDisputeEvidence(id),
  ]);

  const canReply = !["approved", "rejected", "resolved", "closed"].includes(dispute.status);

  return (
    <div className="max-w-3xl space-y-6">
      <DashboardSection
        as="div"
        level="h1"
        title="Dispute"
        actions={<StatusBadge status={dispute.status} />}
      />

      <DashboardCard>
        <p className="break-words text-white">{dispute.reason}</p>

        {canReply && (
          <DashboardActions className="mt-4" stackOnMobile>
            <form
              action={async () => {
                "use server";
                await merchantAcceptRefundAction(id);
              }}
            >
              <Button type="submit" size="sm" className="w-full sm:w-auto">
                Accept refund
              </Button>
            </form>
            <form
              action={async () => {
                "use server";
                await merchantRejectClaimAction(id);
              }}
            >
              <Button type="submit" size="sm" variant="ghost" className="w-full sm:w-auto">
                Reject claim
              </Button>
            </form>
          </DashboardActions>
        )}
      </DashboardCard>

      <DisputeThread
        disputeId={id}
        messages={messages}
        evidence={evidence}
        canReply={canReply}
      />
    </div>
  );
}
