import "server-only";

import { randomUUID } from "node:crypto";
import {
  asBusinessId,
  asUserId,
  publishDomainEvent,
  type BusinessMemberRole,
  type DomainEvent,
  type StoreId,
} from "@/domains";
import type { BusinessHubPort, BusinessRecord } from "@/domains/contracts/ports";
import {
  createBusinessRecord,
  getBusinessById,
  getBusinessesForOwner,
  getMembership,
  linkStoreToBusiness,
  resolveUniqueBusinessSlug,
  revokeMembership,
  updateBusinessRecord,
  upsertMembership,
} from "./repository";
import type { Business, BusinessStatus, BusinessVerificationState } from "./types";
import type { CreateBusinessInput, UpdateBusinessInput } from "./validators";
import { canTransitionBusinessStatus } from "./lifecycle";

export { canTransitionBusinessStatus } from "./lifecycle";

function toRecord(business: Business): BusinessRecord {
  return {
    id: asBusinessId(business.id),
    ownerUserId: asUserId(business.owner_user_id),
    legalName: business.legal_name,
    displayName: business.display_name,
    verificationStatus: business.verification_state,
    primaryStoreId: business.primary_store_id
      ? (business.primary_store_id as StoreId)
      : null,
    createdAt: new Date(business.created_at),
    updatedAt: new Date(business.updated_at),
    deletedAt: business.deleted_at ? new Date(business.deleted_at) : null,
  };
}

async function emit(
  name: DomainEvent["name"],
  input: {
    actorId: string | null;
    businessId: string | null;
    payload: Record<string, unknown>;
  },
) {
  await publishDomainEvent({
    id: randomUUID(),
    name,
    occurredAt: new Date(),
    actorId: input.actorId,
    businessId: input.businessId,
    payload: input.payload,
    correlationId: randomUUID(),
  });
}

/**
 * Ensure a Business exists for a merchant owner after a store is created.
 * Idempotent — reuses existing business for the owner when present.
 */
export async function ensureBusinessForStoreOwner(input: {
  ownerUserId: string;
  storeId: string;
  storeName: string;
  storeSlug: string;
  businessType?: string | null;
  logoUrl?: string | null;
  storeStatus?: "pending" | "active" | "suspended";
}): Promise<Business> {
  const existing = await getBusinessesForOwner(input.ownerUserId);
  let business = existing[0] ?? null;

  if (!business) {
    const slug = await resolveUniqueBusinessSlug(`${input.storeSlug}-biz`);
    business = await createBusinessRecord({
      ownerUserId: input.ownerUserId,
      legalName: input.storeName,
      displayName: input.storeName,
      slug,
      businessType: input.businessType,
      logoUrl: input.logoUrl,
      primaryStoreId: input.storeId,
      status:
        input.storeStatus === "active"
          ? "active"
          : input.storeStatus === "suspended"
            ? "suspended"
            : "pending",
      metadata: { source: "ensureBusinessForStoreOwner" },
    });
    await upsertMembership({
      businessId: business.id,
      userId: input.ownerUserId,
      role: "owner",
    });
    await emit("business.created", {
      actorId: input.ownerUserId,
      businessId: business.id,
      payload: {
        storeId: input.storeId,
        slug: business.slug,
        displayName: business.display_name,
        legalName: business.legal_name,
        businessType: input.businessType,
        logoUrl: input.logoUrl,
      },
    });

    try {
      const { ensureCompanyNetworkProfile } = await import(
        "@/modules/atlas-network/service"
      );
      await ensureCompanyNetworkProfile({
        businessId: business.id,
        ownerUserId: input.ownerUserId,
        displayName: business.display_name,
        legalName: business.legal_name,
        slug: business.slug,
        businessType: input.businessType,
        logoUrl: input.logoUrl,
      });
    } catch {
      /* DB trigger may have provisioned profile */
    }

    try {
      const { ensureBusinessPulse } = await import(
        "@/modules/atlas-pulse/service"
      );
      await ensureBusinessPulse({
        businessId: business.id,
        ownerUserId: input.ownerUserId,
        displayName: business.display_name,
      });
    } catch {
      /* non-fatal */
    }

    try {
      const { ensureBusinessConnect } = await import(
        "@/modules/atlas-connect/service"
      );
      await ensureBusinessConnect({
        businessId: business.id,
        ownerUserId: input.ownerUserId,
        displayName: business.display_name,
        slug: business.slug,
      });
    } catch {
      /* DB trigger may have provisioned workspace */
    }

    try {
      const { ensureBusinessAi } = await import("@/modules/atlas-ai/service");
      await ensureBusinessAi({
        businessId: business.id,
        ownerUserId: input.ownerUserId,
        displayName: business.display_name,
        slug: business.slug,
      });
    } catch {
      /* DB trigger may have provisioned AI workspace */
    }

    try {
      const { ensureMarketplaceStorefront } = await import(
        "@/modules/atlas-marketplace/service"
      );
      await ensureMarketplaceStorefront({
        businessId: business.id,
        ownerUserId: input.ownerUserId,
        displayName: business.display_name,
        slug: business.slug,
        storeId: input.storeId,
      });
    } catch {
      /* DB trigger may have provisioned storefront */
    }
  }

  await linkStoreToBusiness(input.storeId, business.id);

  if (!business.primary_store_id) {
    business = await updateBusinessRecord(business.id, {
      primary_store_id: input.storeId,
    });
  }

  await emit("store.created", {
    actorId: input.ownerUserId,
    businessId: business.id,
    payload: { storeId: input.storeId },
  });

  return business;
}

export async function createBusinessForUser(
  ownerUserId: string,
  input: CreateBusinessInput,
): Promise<Business> {
  const baseSlug =
    input.slug ??
    input.displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const slug = await resolveUniqueBusinessSlug(baseSlug);
  const business = await createBusinessRecord({
    ownerUserId,
    legalName: input.legalName,
    displayName: input.displayName,
    slug,
    businessType: input.businessType,
    metadata: { source: "createBusinessForUser" },
  });
  await upsertMembership({
    businessId: business.id,
    userId: ownerUserId,
    role: "owner",
  });
  await emit("business.created", {
    actorId: ownerUserId,
    businessId: business.id,
    payload: {
      slug: business.slug,
      displayName: business.display_name,
      legalName: business.legal_name,
    },
  });

  try {
    const { ensureCompanyNetworkProfile } = await import(
      "@/modules/atlas-network/service"
    );
    await ensureCompanyNetworkProfile({
      businessId: business.id,
      ownerUserId,
      displayName: business.display_name,
      legalName: business.legal_name,
      slug: business.slug,
      businessType: input.businessType,
    });
  } catch {
    /* non-fatal */
  }

  try {
    const { ensureBusinessPulse } = await import("@/modules/atlas-pulse/service");
    await ensureBusinessPulse({
      businessId: business.id,
      ownerUserId,
      displayName: business.display_name,
    });
  } catch {
    /* non-fatal */
  }

  try {
    const { ensureBusinessConnect } = await import(
      "@/modules/atlas-connect/service"
    );
    await ensureBusinessConnect({
      businessId: business.id,
      ownerUserId,
      displayName: business.display_name,
      slug: business.slug,
    });
  } catch {
    /* non-fatal */
  }

  try {
    const { ensureBusinessAi } = await import("@/modules/atlas-ai/service");
    await ensureBusinessAi({
      businessId: business.id,
      ownerUserId,
      displayName: business.display_name,
      slug: business.slug,
    });
  } catch {
    /* non-fatal */
  }

  try {
    const { ensureMarketplaceStorefront } = await import(
      "@/modules/atlas-marketplace/service"
    );
    await ensureMarketplaceStorefront({
      businessId: business.id,
      ownerUserId,
      displayName: business.display_name,
      slug: business.slug,
      storeId: business.primary_store_id ?? undefined,
    });
  } catch {
    /* non-fatal */
  }

  return business;
}

export async function updateBusinessForUser(
  businessId: string,
  actorUserId: string,
  input: UpdateBusinessInput,
): Promise<Business> {
  const membership = await getMembership(businessId, actorUserId);
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    throw new Error("Insufficient business permissions");
  }

  const patch: Parameters<typeof updateBusinessRecord>[1] = {};
  if (input.legalName !== undefined) patch.legal_name = input.legalName;
  if (input.displayName !== undefined) patch.display_name = input.displayName;
  if (input.businessType !== undefined) patch.business_type = input.businessType;
  if (input.logoUrl !== undefined) patch.logo_url = input.logoUrl;
  if (input.profile !== undefined) patch.profile = input.profile;
  if (input.settings !== undefined) patch.settings = input.settings;
  if (input.metadata !== undefined) patch.metadata = input.metadata;

  const business = await updateBusinessRecord(businessId, patch);
  await emit("business.updated", {
    actorId: actorUserId,
    businessId,
    payload: { fields: Object.keys(patch) },
  });
  return business;
}

export async function setBusinessVerificationState(
  businessId: string,
  actorUserId: string,
  state: BusinessVerificationState,
): Promise<Business> {
  const business = await updateBusinessRecord(businessId, {
    verification_state: state,
  });
  const eventName =
    state === "verified"
      ? "business.verification_approved"
      : state === "rejected"
        ? "business.verification_rejected"
        : "business.verification_submitted";
  await emit(eventName, {
    actorId: actorUserId,
    businessId,
    payload: { state },
  });
  return business;
}

export async function setBusinessStatus(
  businessId: string,
  actorUserId: string,
  status: BusinessStatus,
): Promise<Business> {
  const current = await getBusinessById(businessId);
  if (!current) throw new Error("Business not found");
  if (!canTransitionBusinessStatus(current.status, status)) {
    throw new Error(
      `Invalid business status transition: ${current.status} → ${status}`,
    );
  }

  const business = await updateBusinessRecord(businessId, { status });
  if (status === "active") {
    await emit("store.activated", {
      actorId: actorUserId,
      businessId,
      payload: { status },
    });
  } else if (status === "suspended") {
    await emit("store.suspended", {
      actorId: actorUserId,
      businessId,
      payload: { status },
    });
  }
  return business;
}

export async function addBusinessMember(input: {
  businessId: string;
  actorUserId: string;
  userId: string;
  role: BusinessMemberRole;
}): Promise<void> {
  const actor = await getMembership(input.businessId, input.actorUserId);
  if (!actor || !["owner", "admin"].includes(actor.role)) {
    throw new Error("Insufficient business permissions");
  }
  if (input.role === "owner" && actor.role !== "owner") {
    throw new Error("Only owners can assign owner role");
  }
  await upsertMembership({
    businessId: input.businessId,
    userId: input.userId,
    role: input.role,
    invitedBy: input.actorUserId,
  });
  await emit("business.member_added", {
    actorId: input.actorUserId,
    businessId: input.businessId,
    payload: { userId: input.userId, role: input.role },
  });
}

export async function removeBusinessMember(input: {
  businessId: string;
  actorUserId: string;
  userId: string;
}): Promise<void> {
  const actor = await getMembership(input.businessId, input.actorUserId);
  if (!actor || !["owner", "admin"].includes(actor.role)) {
    throw new Error("Insufficient business permissions");
  }
  const target = await getMembership(input.businessId, input.userId);
  if (!target) {
    throw new Error("Membership not found");
  }
  if (target.role === "owner") {
    throw new Error("Cannot revoke the business owner");
  }
  if (input.userId === input.actorUserId) {
    throw new Error("Cannot revoke your own membership");
  }
  await revokeMembership(input.businessId, input.userId);
  await emit("business.member_removed", {
    actorId: input.actorUserId,
    businessId: input.businessId,
    payload: { userId: input.userId, previousRole: target.role },
  });
}

export async function assertBusinessAccess(
  businessId: string,
  userId: string,
  roles?: BusinessMemberRole[],
): Promise<boolean> {
  const membership = await getMembership(businessId, userId);
  if (!membership) return false;
  if (!roles?.length) return true;
  return roles.includes(membership.role);
}

/** Adapter implementing the shared BusinessHubPort contract. */
export function createBusinessHubPort(): BusinessHubPort {
  return {
    async getById(id) {
      const business = await getBusinessById(id);
      return business ? toRecord(business) : null;
    },
    async getByOwner(userId) {
      const list = await getBusinessesForOwner(userId);
      return list.map(toRecord);
    },
    async assertMember(businessId, userId, roles) {
      return assertBusinessAccess(businessId, userId, roles);
    },
  };
}
