import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import {
  getDisputeById,
  getDisputeMessages,
  getDisputeEvidence,
} from "@/modules/disputes/repository";
import { DisputeThread } from "@/components/disputes/DisputeThread";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DashboardCard, DashboardSection } from "@/components/dashboard";

export default async function CustomerDisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const { id } = await params;
  const dispute = await getDisputeById(id);
  if (!dispute || dispute.customer_id !== profile.id) notFound();

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
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted">Reason</h2>
        <p className="mt-2 whitespace-pre-line break-words text-white">{dispute.reason}</p>
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
