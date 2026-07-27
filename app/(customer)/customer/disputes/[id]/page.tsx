import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import {
  getDisputeById,
  getDisputeMessages,
  getDisputeEvidence,
} from "@/modules/disputes/repository";
import { DisputeThread } from "@/components/disputes/DisputeThread";
import { StatusBadge } from "@/components/ui/StatusBadge";

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
      <div>
        <h1 className="text-3xl font-bold text-white">Dispute</h1>
        <div className="mt-2"><StatusBadge status={dispute.status} /></div>
        <p className="mt-4 text-white">{dispute.reason}</p>
      </div>
      <DisputeThread
        disputeId={id}
        messages={messages}
        evidence={evidence}
        canReply={canReply}
      />
    </div>
  );
}
