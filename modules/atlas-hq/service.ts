import "server-only";

import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { publishDomainEvent } from "@/domains";
import type { AtlasHqPort } from "@/domains/contracts/ports";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { setUserPassword, getUserPasswordHash } from "@/lib/auth/authjs-adapter";
import { BCRYPT_ROUNDS_HQ } from "./constants";
import {
  canSeeNexarHq,
  dashboardsForStaffRole,
  isPlatformOwnerRole,
  isHqStaffRole,
  resolvePostLoginPath,
} from "./founder";
import {
  getActiveAnnouncements,
  getBootstrapState,
  getHqTeamMemberByUserId,
  getPlatformOwnerByUserId,
  insertAnnouncement,
  insertHqTeamMember,
  listAnnouncements,
  listHqTeamMembers,
  listWebsitePages,
  markOwner2faEnabled,
  markOwnerPasswordChanged,
  touchPlatformOwnerLogin,
  updateAnnouncement,
  updateHqTeamMemberRecord,
  upsertWebsitePage,
} from "./repository";
import type {
  HqAnnouncementDraft,
  HqSessionContext,
  HqStaffRole,
  HqTeamMemberStatus,
} from "./types";
import {
  addHqTeamMemberSchema,
  hqAnnouncementSchema,
  hqWebsitePageSchema,
  updateHqTeamMemberSchema,
} from "./validators";

export { ensureNexarHqBootstrap } from "./bootstrap";

async function emit(
  name:
    | "hq.bootstrapped"
    | "hq.owner_login"
    | "hq.team_member_added"
    | "hq.announcement_updated"
    | "hq.website_page_updated",
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
 * Resolve NEXAR HQ session after ATLAS authentication.
 * Customers never receive hqVisibleInSidebar=true.
 */
export async function resolveHqSessionContext(
  userId: string,
  profileRole?: string | null,
): Promise<HqSessionContext> {
  const bootstrap = await getBootstrapState();
  const owner = await getPlatformOwnerByUserId(userId);
  const staff = await getHqTeamMemberByUserId(userId);
  const isOwner =
    Boolean(owner) || isPlatformOwnerRole(profileRole ?? null);
  const isStaff = Boolean(staff && staff.status === "active");

  const staffRole: HqSessionContext["staffRole"] = isOwner
    ? "platform_owner"
    : isStaff && isHqStaffRole(staff!.platformRole)
      ? staff!.platformRole
      : isStaff
        ? "custom"
        : null;

  const hqVisible = canSeeNexarHq({
    role: profileRole,
    isPlatformOwner: isOwner,
    isHqStaff: isStaff,
  });

  return {
    userId,
    isPlatformOwner: isOwner,
    hqEnabled: isOwner ? (owner?.hqEnabled ?? true) : isStaff,
    hqVisibleInSidebar: hqVisible,
    nexarBusinessId: bootstrap?.nexarBusinessId ?? null,
    nexarWorkspaceId: bootstrap?.nexarWorkspaceId ?? null,
    staffRole,
    allowedSections: staffRole
      ? dashboardsForStaffRole(
          staffRole === "platform_owner" ? "platform_owner" : staffRole,
        )
      : [],
    mustChangePassword: owner?.mustChangePassword ?? false,
    mustEnable2fa: owner?.mustEnable2fa ?? false,
  };
}

export async function recordPlatformOwnerLogin(userId: string): Promise<void> {
  await touchPlatformOwnerLogin(userId);
  const bootstrap = await getBootstrapState();
  await emit("hq.owner_login", {
    actorId: userId,
    businessId: bootstrap?.nexarBusinessId ?? null,
    payload: { userId },
  });
}

/**
 * Post-login routing for Platform Owner — ATLAS + NEXAR workspace, not legacy /admin.
 */
export { resolvePostLoginPath } from "./founder";

export async function completePlatformOwnerPasswordChange(input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean; error?: string }> {
  const owner = await getPlatformOwnerByUserId(input.userId);
  if (!owner) return { success: false, error: "Not a Platform Owner" };

  const admin = tryCreateAdminClient();
  if (!admin) return { success: false, error: "Server not configured" };

  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", input.userId)
    .maybeSingle();
  const email = (profile?.email as string | undefined) ?? owner.email;
  const user = await getUserPasswordHash(email);
  if (!user?.password) return { success: false, error: "Account not found" };

  const valid = await bcrypt.compare(input.currentPassword, user.password);
  if (!valid) return { success: false, error: "Current password is incorrect" };

  const hash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS_HQ);
  await setUserPassword(input.userId, hash);
  await markOwnerPasswordChanged(input.userId);
  return { success: true };
}

export async function completePlatformOwner2fa(userId: string): Promise<void> {
  await markOwner2faEnabled(userId);
}

/** Platform Owner is NEVER returned from Team Management. */
export async function listTeamForManagement(): Promise<
  Awaited<ReturnType<typeof listHqTeamMembers>>
> {
  const members = await listHqTeamMembers();
  const bootstrap = await getBootstrapState();
  const ownerId = bootstrap?.platformOwnerUserId;
  return members.filter((m) => m.userId !== ownerId);
}

export async function addHqTeamMember(input: {
  actorId: string;
  email: string;
  platformRole: HqStaffRole;
  status?: HqTeamMemberStatus;
  customRoleId?: string | null;
  userId: string;
}): Promise<Awaited<ReturnType<typeof insertHqTeamMember>>> {
  const parsed = addHqTeamMemberSchema.parse({
    email: input.email,
    platformRole: input.platformRole,
    status: input.status ?? "invited",
    customRoleId: input.customRoleId,
  });

  const owner = await getPlatformOwnerByUserId(input.userId);
  if (owner) {
    throw new Error("Platform Owner cannot be added to Team Management");
  }

  const bootstrap = await getBootstrapState();
  if (bootstrap?.platformOwnerUserId === input.userId) {
    throw new Error("Platform Owner cannot be added to Team Management");
  }

  const member = await insertHqTeamMember({
    userId: input.userId,
    email: parsed.email,
    platformRole: parsed.platformRole,
    status: parsed.status,
    invitedBy: input.actorId,
    customRoleId: parsed.customRoleId,
  });

  await emit("hq.team_member_added", {
    actorId: input.actorId,
    businessId: bootstrap?.nexarBusinessId ?? null,
    payload: {
      memberId: member.id,
      email: member.email,
      platformRole: member.platformRole,
    },
  });

  return member;
}

export async function updateHqTeamMember(input: {
  actorId: string;
  memberId: string;
  platformRole?: HqStaffRole;
  status?: HqTeamMemberStatus;
  customRoleId?: string | null;
}): Promise<Awaited<ReturnType<typeof updateHqTeamMemberRecord>>> {
  const parsed = updateHqTeamMemberSchema.parse(input);
  const members = await listHqTeamMembers();
  const target = members.find((m) => m.id === parsed.memberId);
  if (!target) return null;

  const owner = await getPlatformOwnerByUserId(target.userId);
  if (owner) {
    throw new Error("Platform Owner cannot be modified via Team Management");
  }

  return updateHqTeamMemberRecord({
    memberId: parsed.memberId,
    platformRole: parsed.platformRole,
    status: parsed.status,
    customRoleId: parsed.customRoleId,
    actorId: input.actorId,
  });
}

export async function createHqAnnouncement(
  actorId: string,
  draft: HqAnnouncementDraft,
) {
  const parsed = hqAnnouncementSchema.parse(draft);
  const row = await insertAnnouncement(parsed);
  await emit("hq.announcement_updated", {
    actorId,
    businessId: null,
    payload: { announcementId: row.id, action: "create" },
  });
  return row;
}

export async function updateHqAnnouncement(
  actorId: string,
  id: string,
  draft: Partial<HqAnnouncementDraft>,
) {
  const row = await updateAnnouncement(id, draft);
  if (row) {
    await emit("hq.announcement_updated", {
      actorId,
      businessId: null,
      payload: { announcementId: id, action: "update" },
    });
  }
  return row;
}

export async function upsertHqWebsitePage(
  actorId: string,
  input: Parameters<typeof upsertWebsitePage>[0],
) {
  const parsed = hqWebsitePageSchema.parse({
    slug: input.slug,
    title: input.title,
    pageType: input.pageType,
    path: input.path,
    locale: input.locale,
    status: input.status,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    content: input.content,
  });
  const row = await upsertWebsitePage({
    slug: parsed.slug,
    title: parsed.title,
    pageType: parsed.pageType,
    path: parsed.path,
    locale: parsed.locale,
    status: parsed.status,
    seoTitle: parsed.seoTitle,
    seoDescription: parsed.seoDescription,
    content: parsed.content,
  });
  await emit("hq.website_page_updated", {
    actorId,
    businessId: null,
    payload: { pageId: row.id, slug: parsed.slug },
  });
  return row;
}

export async function getHqWebsiteCatalog() {
  return listWebsitePages();
}

export async function getHqAnnouncementCenter() {
  return listAnnouncements();
}

export async function getPublicAnnouncementBar() {
  return getActiveAnnouncements();
}

export function createAtlasHqPort(): AtlasHqPort {
  return {
    async resolveSession(userId, role) {
      return resolveHqSessionContext(userId, role);
    },
    async listTeam() {
      return listTeamForManagement();
    },
    async getActiveAnnouncements() {
      return getActiveAnnouncements();
    },
    async listWebsitePages() {
      return listWebsitePages();
    },
    async ensureBootstrap() {
      const { ensureNexarHqBootstrap } = await import("./bootstrap");
      return ensureNexarHqBootstrap();
    },
  };
}
