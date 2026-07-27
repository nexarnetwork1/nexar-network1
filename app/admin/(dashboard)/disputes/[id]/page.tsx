import { notFound } from "next/navigation";
import { requireRole } from "@/modules/users/repository";
import {
  getDisputeById,
  getDisputeMessages,
  getDisputeEvidence,
} from "@/modules/disputes/repository";
import {
  adminResolveDisputeAction,
  adminRequestMoreInfoAction,
} from "@/modules/disputes/actions";
import { DisputeThread } from "@/components/disputes/DisputeThread";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";

export default async function AdminDisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin"]);
  const { id } = await params;
  const dispute = await getDisputeById(id);
  if (!dispute) notFound();

  const [messages, evidence] = await Promise.all([
    getDisputeMessages(id),
    getDisputeEvidence(id),
  ]);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Dispute review</h1>
        <p className="mt-2 text-muted">Order {dispute.order_id.slice(0, 8)}…</p>
        <div className="mt-4"><StatusBadge status={dispute.status} /></div>
        <p className="mt-4 text-white">{dispute.reason}</p>
      </div>

      <DisputeThread
        disputeId={id}
        messages={messages}
        evidence={evidence}
        canReply
      />

      <section className="flex flex-wrap gap-3">
        <form action={async () => {
          "use server";
          await adminRequestMoreInfoAction(id);
        }}>
          <Button type="submit" variant="ghost">Request more info</Button>
        </form>
        <form action={async () => {
          "use server";
          await adminResolveDisputeAction({
            disputeId: id,
            status: "approved",
            resolution: "Refund approved by administrator",
            refundEscrow: true,
          });
        }}>
          <Button type="submit">Approve refund</Button>
        </form>
        <form action={async () => {
          "use server";
          await adminResolveDisputeAction({
            disputeId: id,
            status: "rejected",
            resolution: "Claim rejected by administrator",
          });
        }}>
          <Button type="submit" variant="ghost">Reject dispute</Button>
        </form>
        <form action={async () => {
          "use server";
          await adminResolveDisputeAction({
            disputeId: id,
            status: "resolved",
            resolution: "Escrow released to merchant",
            releaseEscrow: true,
          });
        }}>
          <Button type="submit" variant="ghost">Release escrow</Button>
        </form>
      </section>
    </div>
  );
}
