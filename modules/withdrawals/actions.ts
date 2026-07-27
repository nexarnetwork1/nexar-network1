"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuthenticatedProfile } from "@/lib/auth/guards";
import { requireStoreOwner } from "@/lib/auth/guards";
import { createWithdrawalRequest, reviewWithdrawal } from "./repository";
import { writeAuditLog } from "@/modules/audit/repository";
import { dispatchNotification } from "@/modules/notifications/dispatch";
import type { ActionResult } from "@/modules/auth/actions";

const withdrawalSchema = z.object({
  storeId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

export async function requestWithdrawalFormAction(formData: FormData): Promise<void> {
  await requestWithdrawalAction(formData);
}

export async function requestWithdrawalAction(formData: FormData): Promise<ActionResult> {
  const profile = await requireAuthenticatedProfile(["merchant"]);
  const parsed = withdrawalSchema.safeParse({
    storeId: formData.get("storeId"),
    amount: formData.get("amount"),
    walletAddress: formData.get("walletAddress"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await requireStoreOwner(parsed.data.storeId);

  const result = await createWithdrawalRequest({
    merchantId: profile.id,
    storeId: parsed.data.storeId,
    amount: parsed.data.amount,
    currency: "USD",
    walletAddress: parsed.data.walletAddress,
  });
  if (result.error) return { success: false, error: result.error };

  await writeAuditLog({
    actorId: profile.id,
    actorRole: profile.role,
    action: "withdrawal.requested",
    entityType: "withdrawal",
    entityId: result.id,
    metadata: { amount: parsed.data.amount, store_id: parsed.data.storeId },
  });

  revalidatePath("/merchant/withdrawals");
  return { success: true };
}

export async function adminReviewWithdrawalAction(params: {
  withdrawalId: string;
  approve: boolean;
  rejectionReason?: string;
}): Promise<ActionResult> {
  const profile = await requireAuthenticatedProfile(["admin"]);
  const status = params.approve ? "approved" : "rejected";

  const ok = await reviewWithdrawal({
    withdrawalId: params.withdrawalId,
    reviewerId: profile.id,
    status,
    rejectionReason: params.rejectionReason,
  });
  if (!ok) return { success: false, error: "Review failed" };

  await writeAuditLog({
    actorId: profile.id,
    actorRole: profile.role,
    action: `withdrawal.${status}`,
    entityType: "withdrawal",
    entityId: params.withdrawalId,
  });

  revalidatePath("/admin/withdrawals");
  return { success: true };
}
