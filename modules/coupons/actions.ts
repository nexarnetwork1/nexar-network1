"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuthenticatedProfile, requireStoreOwner } from "@/lib/auth/guards";
import { createCoupon } from "./repository";
import { writeAuditLog } from "@/modules/audit/repository";
import type { ActionResult } from "@/modules/auth/actions";
import type { CouponScope, CouponType } from "@/types";

const couponSchema = z.object({
  code: z.string().min(3).max(32),
  couponType: z.enum(["percentage", "fixed"]),
  couponScope: z.enum(["merchant", "platform"]),
  storeId: z.string().uuid().optional(),
  value: z.coerce.number().positive(),
  usageLimit: z.coerce.number().int().positive().optional(),
  minOrderUsd: z.coerce.number().min(0).optional(),
  expiresAt: z.string().optional(),
});

export async function createCouponFormAction(formData: FormData): Promise<void> {
  await createCouponAction(formData);
}

export async function createCouponAction(formData: FormData): Promise<ActionResult> {
  const profile = await requireAuthenticatedProfile(["merchant", "admin"]);
  const parsed = couponSchema.safeParse({
    code: formData.get("code"),
    couponType: formData.get("couponType"),
    couponScope: formData.get("couponScope"),
    storeId: formData.get("storeId") || undefined,
    value: formData.get("value"),
    usageLimit: formData.get("usageLimit") || undefined,
    minOrderUsd: formData.get("minOrderUsd") || undefined,
    expiresAt: formData.get("expiresAt") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  if (parsed.data.couponScope === "merchant") {
    if (!parsed.data.storeId) return { success: false, error: "Store required" };
    await requireStoreOwner(parsed.data.storeId);
  } else if (profile.role !== "admin") {
    return { success: false, error: "Only admins can create platform coupons" };
  }

  const result = await createCoupon({
    code: parsed.data.code,
    couponType: parsed.data.couponType as CouponType,
    couponScope: parsed.data.couponScope as CouponScope,
    storeId: parsed.data.storeId,
    value: parsed.data.value,
    usageLimit: parsed.data.usageLimit,
    minOrderUsd: parsed.data.minOrderUsd,
    expiresAt: parsed.data.expiresAt,
    createdBy: profile.id,
  });

  if (result.error) return { success: false, error: result.error };

  await writeAuditLog({
    actorId: profile.id,
    actorRole: profile.role,
    action: "coupon.created",
    entityType: "coupon",
    entityId: result.id,
    metadata: { code: parsed.data.code, scope: parsed.data.couponScope },
  });

  revalidatePath("/merchant/coupons");
  revalidatePath("/admin/coupons");
  return { success: true };
}
