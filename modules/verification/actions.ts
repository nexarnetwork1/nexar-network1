"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedProfile } from "@/lib/auth/guards";
import { updateVerificationStatus } from "./repository";
import { writeAuditLog } from "@/modules/audit/repository";
import { dispatchNotification } from "@/modules/notifications/dispatch";
import type { ActionResult } from "@/modules/auth/actions";
import type { MerchantVerificationLevel } from "@/types";

export async function adminUpdateVerificationAction(params: {
  profileId: string;
  status: "pending" | "under_review" | "verified" | "rejected" | "suspended" | "blacklisted";
  level?: MerchantVerificationLevel;
  reason?: string;
}): Promise<ActionResult> {
  const profile = await requireAuthenticatedProfile(["admin"]);

  const ok = await updateVerificationStatus({
    profileId: params.profileId,
    status: params.status,
    level: params.level,
    blacklistReason: params.reason,
  });
  if (!ok) return { success: false, error: "Update failed" };

  await writeAuditLog({
    actorId: profile.id,
    actorRole: profile.role,
    action: "merchant.verification_updated",
    entityType: "merchant_profile",
    entityId: params.profileId,
    metadata: { status: params.status, level: params.level, reason: params.reason },
  });

  const event = params.status === "verified" ? "merchant.approved" : "merchant.rejected";
  await dispatchNotification({
    event,
    userId: params.profileId,
    title: params.status === "verified" ? "Merchant verified" : "Verification update",
    body: params.reason ?? `Your verification status is now: ${params.status}`,
    type: "verification",
    metadata: { status: params.status },
  }).catch(() => undefined);

  revalidatePath("/admin/verification");
  revalidatePath("/admin/merchants");
  return { success: true };
}
