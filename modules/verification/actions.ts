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

  // Keep Business Hub verification_state in sync with merchant profile KYC.
  try {
    const { getBusinessesForOwner } = await import(
      "@/modules/business-hub/repository"
    );
    const { setBusinessVerificationState } = await import(
      "@/modules/business-hub/service"
    );
    const businesses = await getBusinessesForOwner(params.profileId);
    const mapped =
      params.status === "verified"
        ? "verified"
        : params.status === "rejected"
          ? "rejected"
          : params.status === "pending" || params.status === "under_review"
            ? "pending"
            : "unverified";
    for (const business of businesses) {
      await setBusinessVerificationState(business.id, profile.id, mapped);
    }
  } catch {
    // Non-fatal: merchant profile remains source for legacy admin UI.
  }

  revalidatePath("/admin/verification");
  revalidatePath("/admin/merchants");
  return { success: true };
}
