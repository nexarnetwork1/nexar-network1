import Link from "next/link";
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
      <Link href="/merchant/disputes" className="text-sm text-gold hover:underline">← Back</Link>
      <div>
        <h1 className="text-3xl font-bold text-white">Dispute</h1>
        <div className="mt-2"><StatusBadge status={dispute.status} /></div>
        <p className="mt-4 text-white">{dispute.reason}</p>
      </div>

      {canReply && (
        <div className="flex gap-3">
          <form action={async () => {
            "use server";
            await merchantAcceptRefundAction(id);
          }}>
            <Button type="submit" size="sm">Accept refund</Button>
          </form>
          <form action={async () => {
            "use server";
            await merchantRejectClaimAction(id);
          }}>
            <Button type="submit" size="sm" variant="ghost">Reject claim</Button>
          </form>
        </div>
      )}

      <DisputeThread
        disputeId={id}
        messages={messages}
        evidence={evidence}
        canReply={canReply}
      />
    </div>
  );
}
