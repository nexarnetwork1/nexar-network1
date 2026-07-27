"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuthenticatedProfile, requireOrderAccess } from "@/lib/auth/guards";
import {
  openDispute,
  addDisputeMessage,
  addDisputeEvidence,
  updateDisputeStatus,
  getDisputeById,
} from "./repository";
import { writeAuditLog } from "@/modules/audit/repository";
import { dispatchNotification } from "@/modules/notifications/dispatch";
import { releaseEscrow, refundEscrow } from "@/modules/escrow/repository";
import { getStoreById } from "@/modules/stores/repository";
import type { ActionResult } from "@/modules/auth/actions";
import type { DisputeStatus } from "@/types";

const openDisputeSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().min(10).max(2000),
});

export async function openDisputeFormAction(formData: FormData): Promise<void> {
  await openDisputeAction(formData);
}

export async function openDisputeAction(formData: FormData): Promise<ActionResult> {
  const profile = await requireAuthenticatedProfile(["customer"]);
  const parsed = openDisputeSchema.safeParse({
    orderId: formData.get("orderId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await requireOrderAccess(parsed.data.orderId, ["customer"]);

  const result = await openDispute(parsed.data.orderId, profile.id, parsed.data.reason);
  if (result.error) return { success: false, error: result.error };

  await writeAuditLog({
    actorId: profile.id,
    actorRole: profile.role,
    action: "dispute.opened",
    entityType: "dispute",
    entityId: result.disputeId,
    metadata: { order_id: parsed.data.orderId },
  });

  await dispatchNotification({
    event: "dispute.opened",
    userId: profile.id,
    title: "Dispute submitted",
    body: "Your dispute has been opened and is under review.",
    type: "dispute",
    metadata: { dispute_id: result.disputeId, order_id: parsed.data.orderId },
  }).catch(() => undefined);

  revalidatePath("/customer/disputes");
  return { success: true };
}

export async function sendDisputeMessageFormAction(
  disputeId: string,
  message: string
): Promise<void> {
  await sendDisputeMessageAction(disputeId, message);
}

export async function sendDisputeMessageAction(
  disputeId: string,
  message: string
): Promise<ActionResult> {
  const profile = await requireAuthenticatedProfile(["customer", "merchant", "admin"]);
  const dispute = await getDisputeById(disputeId);
  if (!dispute) return { success: false, error: "Dispute not found" };

  const ok = await addDisputeMessage({
    disputeId,
    senderId: profile.id,
    senderRole: profile.role,
    message,
  });
  if (!ok) return { success: false, error: "Failed to send message" };

  revalidateDisputePaths(disputeId);
  return { success: true };
}

export async function uploadDisputeEvidenceFormAction(params: {
  disputeId: string;
  fileUrl: string;
  description?: string;
}): Promise<void> {
  await uploadDisputeEvidenceAction(params);
}

export async function uploadDisputeEvidenceAction(params: {
  disputeId: string;
  fileUrl: string;
  fileType?: string;
  description?: string;
}): Promise<ActionResult> {
  const profile = await requireAuthenticatedProfile(["customer", "merchant", "admin"]);
  const ok = await addDisputeEvidence({
    disputeId: params.disputeId,
    uploadedBy: profile.id,
    fileUrl: params.fileUrl,
    fileType: params.fileType,
    description: params.description,
  });
  if (!ok) return { success: false, error: "Failed to upload evidence" };

  revalidateDisputePaths(params.disputeId);
  return { success: true };
}

export async function merchantAcceptRefundAction(disputeId: string): Promise<ActionResult> {
  const profile = await requireAuthenticatedProfile(["merchant"]);
  const dispute = await getDisputeById(disputeId);
  if (!dispute) return { success: false, error: "Dispute not found" };

  const store = await getStoreById(dispute.store_id);
  if (!store || store.owner_id !== profile.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (dispute.escrow_id) {
    await refundEscrow(dispute.escrow_id, profile.id, "merchant_accepted_refund");
  }

  await updateDisputeStatus(disputeId, "approved", {
    resolution: "Merchant accepted refund",
    resolved_by: profile.id,
    resolved_at: new Date().toISOString(),
  });

  await writeAuditLog({
    actorId: profile.id,
    actorRole: profile.role,
    action: "dispute.merchant_accept_refund",
    entityType: "dispute",
    entityId: disputeId,
  });

  revalidatePath("/merchant/disputes");
  return { success: true };
}

export async function merchantRejectClaimAction(disputeId: string): Promise<ActionResult> {
  const profile = await requireAuthenticatedProfile(["merchant"]);
  const dispute = await getDisputeById(disputeId);
  if (!dispute) return { success: false, error: "Dispute not found" };

  const store = await getStoreById(dispute.store_id);
  if (!store || store.owner_id !== profile.id) {
    return { success: false, error: "Unauthorized" };
  }

  await updateDisputeStatus(disputeId, "under_review", {
    resolution: "Merchant rejected the claim — awaiting admin review",
  });

  await writeAuditLog({
    actorId: profile.id,
    actorRole: profile.role,
    action: "dispute.merchant_rejected",
    entityType: "dispute",
    entityId: disputeId,
  });

  await dispatchNotification({
    event: "dispute.opened",
    userId: dispute.customer_id,
    title: "Dispute update",
    body: "The merchant has responded to your dispute.",
    type: "dispute",
    metadata: { dispute_id: disputeId },
  }).catch(() => undefined);

  revalidatePath("/merchant/disputes");
  return { success: true };
}

export async function adminRequestMoreInfoAction(disputeId: string): Promise<ActionResult> {
  const profile = await requireAuthenticatedProfile(["admin"]);
  const dispute = await getDisputeById(disputeId);
  if (!dispute) return { success: false, error: "Dispute not found" };

  await updateDisputeStatus(disputeId, "awaiting_info");

  await writeAuditLog({
    actorId: profile.id,
    actorRole: profile.role,
    action: "dispute.request_more_info",
    entityType: "dispute",
    entityId: disputeId,
  });

  await dispatchNotification({
    event: "dispute.opened",
    userId: dispute.customer_id,
    title: "More information required",
    body: "Please provide additional details for your dispute.",
    type: "dispute",
    metadata: { dispute_id: disputeId },
  }).catch(() => undefined);

  revalidatePath(`/admin/disputes/${disputeId}`);
  return { success: true };
}

export async function adminResolveDisputeAction(params: {
  disputeId: string;
  status: DisputeStatus;
  resolution: string;
  releaseEscrow?: boolean;
  refundEscrow?: boolean;
}): Promise<ActionResult> {
  const profile = await requireAuthenticatedProfile(["admin"]);
  const dispute = await getDisputeById(params.disputeId);
  if (!dispute) return { success: false, error: "Dispute not found" };

  if (params.refundEscrow && dispute.escrow_id) {
    await refundEscrow(dispute.escrow_id, profile.id, params.resolution);
  } else if (params.releaseEscrow && dispute.escrow_id) {
    await releaseEscrow(dispute.escrow_id, profile.id, params.resolution);
  }

  await updateDisputeStatus(params.disputeId, params.status, {
    resolution: params.resolution,
    resolved_by: profile.id,
    resolved_at: new Date().toISOString(),
  });

  await writeAuditLog({
    actorId: profile.id,
    actorRole: profile.role,
    action: "dispute.admin_resolved",
    entityType: "dispute",
    entityId: params.disputeId,
    metadata: { status: params.status, resolution: params.resolution },
  });

  await dispatchNotification({
    event: "dispute.resolved",
    userId: dispute.customer_id,
    title: "Dispute resolved",
    body: params.resolution,
    type: "dispute",
    metadata: { dispute_id: params.disputeId },
  }).catch(() => undefined);

  revalidatePath("/admin/disputes");
  return { success: true };
}

function revalidateDisputePaths(disputeId: string): void {
  revalidatePath("/merchant/disputes");
  revalidatePath("/customer/disputes");
  revalidatePath(`/merchant/disputes/${disputeId}`);
  revalidatePath(`/customer/disputes/${disputeId}`);
  revalidatePath(`/admin/disputes/${disputeId}`);
}
