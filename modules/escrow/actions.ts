"use server";

import { revalidatePath } from "next/cache";
import { releaseEscrow, refundEscrow } from "./repository";
import { requireAuthenticatedProfile } from "@/lib/auth/guards";
import { writeAuditLog } from "@/modules/audit/repository";
import { dispatchNotification } from "@/modules/notifications/dispatch";
import type { ActionResult } from "@/modules/auth/actions";

export async function releaseEscrowAction(escrowId: string, reason?: string): Promise<ActionResult> {
  const profile = await requireAuthenticatedProfile(["admin"]);
  const result = await releaseEscrow(escrowId, profile.id, reason);
  if (!result.success) return { success: false, error: result.error };

  await writeAuditLog({
    actorId: profile.id,
    actorRole: profile.role,
    action: "escrow.released",
    entityType: "escrow",
    entityId: escrowId,
    metadata: { reason },
  });

  await dispatchNotification({
    event: "escrow.released",
    userId: profile.id,
    title: "Escrow released",
    body: "Funds have been released to the merchant.",
    metadata: { escrow_id: escrowId },
  }).catch(() => undefined);

  revalidatePath("/admin/escrow");
  return { success: true };
}

export async function refundEscrowAction(escrowId: string, reason?: string): Promise<ActionResult> {
  const profile = await requireAuthenticatedProfile(["admin"]);
  const result = await refundEscrow(escrowId, profile.id, reason);
  if (!result.success) return { success: false, error: result.error };

  await writeAuditLog({
    actorId: profile.id,
    actorRole: profile.role,
    action: "escrow.refunded",
    entityType: "escrow",
    entityId: escrowId,
    metadata: { reason },
  });

  revalidatePath("/admin/escrow");
  return { success: true };
}
