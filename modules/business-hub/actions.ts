"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedProfile } from "@/lib/auth/guards";
import { requirePermission } from "@/lib/auth/permissions";
import type { ActionResult } from "@/modules/auth/actions";
import {
  addBusinessMember,
  createBusinessForUser,
  removeBusinessMember,
  updateBusinessForUser,
} from "./service";
import {
  getBusinessById,
  getBusinessesForUser,
  getMembership,
} from "./repository";
import {
  addBusinessMemberSchema,
  createBusinessSchema,
  removeBusinessMemberSchema,
  updateBusinessSchema,
} from "./validators";

export async function createBusinessAction(
  formData: FormData,
): Promise<ActionResult & { businessId?: string }> {
  const profile = await requireAuthenticatedProfile([
    "merchant",
    "business",
    "admin",
  ]);
  await requirePermission(profile, "business:create");

  const parsed = createBusinessSchema.safeParse({
    legalName: formData.get("legalName"),
    displayName: formData.get("displayName"),
    businessType: formData.get("businessType") || undefined,
    slug: formData.get("slug") || undefined,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    const business = await createBusinessForUser(profile.id, parsed.data);
    revalidatePath("/merchant");
    return { success: true, businessId: business.id, redirectTo: "/merchant" };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create business",
    };
  }
}

export async function updateBusinessAction(
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireAuthenticatedProfile([
    "merchant",
    "business",
    "admin",
  ]);
  await requirePermission(profile, "business:update");

  const businessId = String(formData.get("businessId") ?? "");
  if (!businessId) return { success: false, error: "businessId required" };

  const parsed = updateBusinessSchema.safeParse({
    legalName: formData.get("legalName") || undefined,
    displayName: formData.get("displayName") || undefined,
    businessType: formData.get("businessType") || undefined,
    logoUrl: formData.get("logoUrl") || undefined,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    await updateBusinessForUser(businessId, profile.id, parsed.data);
    revalidatePath("/merchant");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update business",
    };
  }
}

export async function addBusinessMemberAction(
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireAuthenticatedProfile([
    "merchant",
    "business",
    "admin",
  ]);
  await requirePermission(profile, "business:members:manage");

  const parsed = addBusinessMemberSchema.safeParse({
    businessId: formData.get("businessId"),
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    await addBusinessMember({
      businessId: parsed.data.businessId,
      actorUserId: profile.id,
      userId: parsed.data.userId,
      role: parsed.data.role,
    });
    revalidatePath("/merchant");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to add member",
    };
  }
}

export async function removeBusinessMemberAction(
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireAuthenticatedProfile([
    "merchant",
    "business",
    "admin",
  ]);
  await requirePermission(profile, "business:members:manage");

  const parsed = removeBusinessMemberSchema.safeParse({
    businessId: formData.get("businessId"),
    userId: formData.get("userId"),
  });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    await removeBusinessMember({
      businessId: parsed.data.businessId,
      actorUserId: profile.id,
      userId: parsed.data.userId,
    });
    revalidatePath("/merchant");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to remove member",
    };
  }
}

export async function getMyBusinessesAction() {
  const profile = await requireAuthenticatedProfile([
    "merchant",
    "business",
    "admin",
    "customer",
  ]);
  return getBusinessesForUser(profile.id);
}

export async function getBusinessDetailAction(businessId: string) {
  const profile = await requireAuthenticatedProfile();
  const membership = await getMembership(businessId, profile.id);
  if (!membership && profile.role !== "admin" && profile.role !== "super_admin") {
    throw new Error("Unauthorized");
  }
  return getBusinessById(businessId);
}
