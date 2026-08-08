import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  HqAnnouncementDraft,
  HqTeamMemberRecord,
  HqTeamMemberStatus,
  PlatformOwnerRecord,
} from "./types";

function db() {
  return createAdminClient();
}

function mapOwner(row: Record<string, unknown>): PlatformOwnerRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    email: String(row.email),
    isPermanent: Boolean(row.is_permanent),
    mustChangePassword: Boolean(row.must_change_password),
    mustEnable2fa: Boolean(row.must_enable_2fa),
    passwordChangedAt: (row.password_changed_at as string | null) ?? null,
    totpEnabled: Boolean(row.totp_enabled),
    firstLoginAt: (row.first_login_at as string | null) ?? null,
    lastLoginAt: (row.last_login_at as string | null) ?? null,
    hqEnabled: Boolean(row.hq_enabled),
  };
}

function mapMember(row: Record<string, unknown>): HqTeamMemberRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    email: String(row.email),
    platformRole: String(row.platform_role),
    status: row.status as HqTeamMemberStatus,
    customRoleId: (row.custom_role_id as string | null) ?? null,
    lastLoginAt: (row.last_login_at as string | null) ?? null,
    activityLog: Array.isArray(row.activity_log) ? row.activity_log : [],
  };
}

export async function getBootstrapState(): Promise<{
  completed: boolean;
  platformOwnerUserId: string | null;
  nexarBusinessId: string | null;
  nexarWorkspaceId: string | null;
} | null> {
  const { data, error } = await db()
    .from("atlas_hq_bootstrap")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) return null;
  return {
    completed: Boolean(data.completed_at),
    platformOwnerUserId: (data.platform_owner_user_id as string | null) ?? null,
    nexarBusinessId: (data.nexar_business_id as string | null) ?? null,
    nexarWorkspaceId: (data.nexar_workspace_id as string | null) ?? null,
  };
}

export async function markBootstrapComplete(input: {
  platformOwnerUserId: string;
  nexarBusinessId: string;
  nexarWorkspaceId: string | null;
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  const { data, error } = await db()
    .from("atlas_hq_bootstrap")
    .update({
      completed_at: new Date().toISOString(),
      platform_owner_user_id: input.platformOwnerUserId,
      nexar_business_id: input.nexarBusinessId,
      nexar_workspace_id: input.nexarWorkspaceId,
      metadata: input.metadata ?? {},
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1)
    .is("completed_at", null)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function getPlatformOwnerByUserId(
  userId: string,
): Promise<PlatformOwnerRecord | null> {
  const { data, error } = await db()
    .from("atlas_hq_platform_owners")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) return null;
  return mapOwner(data as Record<string, unknown>);
}

export async function getPlatformOwnerByEmail(
  email: string,
): Promise<PlatformOwnerRecord | null> {
  const { data, error } = await db()
    .from("atlas_hq_platform_owners")
    .select("*")
    .eq("email", email.toLowerCase())
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) return null;
  return mapOwner(data as Record<string, unknown>);
}

export async function insertPlatformOwner(input: {
  userId: string;
  email: string;
}): Promise<PlatformOwnerRecord> {
  const { data, error } = await db()
    .from("atlas_hq_platform_owners")
    .insert({
      user_id: input.userId,
      email: input.email.toLowerCase(),
      is_permanent: true,
      must_change_password: true,
      must_enable_2fa: true,
      hq_enabled: true,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "insertPlatformOwner failed");
  return mapOwner(data as Record<string, unknown>);
}

export async function touchPlatformOwnerLogin(userId: string): Promise<void> {
  const now = new Date().toISOString();
  const existing = await getPlatformOwnerByUserId(userId);
  await db()
    .from("atlas_hq_platform_owners")
    .update({
      last_login_at: now,
      first_login_at: existing?.firstLoginAt ?? now,
      updated_at: now,
    })
    .eq("user_id", userId)
    .is("deleted_at", null);
}

export async function markOwnerPasswordChanged(userId: string): Promise<void> {
  await db()
    .from("atlas_hq_platform_owners")
    .update({
      must_change_password: false,
      password_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}

export async function markOwner2faEnabled(userId: string): Promise<void> {
  await db()
    .from("atlas_hq_platform_owners")
    .update({
      must_enable_2fa: false,
      totp_enabled: true,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}

/** Team list NEVER includes Platform Owner rows. */
export async function listHqTeamMembers(): Promise<HqTeamMemberRecord[]> {
  const { data, error } = await db()
    .from("atlas_hq_team_members")
    .select("*")
    .is("deleted_at", null)
    .neq("status", "deleted")
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []).map((r) => mapMember(r as Record<string, unknown>));
}

export async function getHqTeamMemberByUserId(
  userId: string,
): Promise<HqTeamMemberRecord | null> {
  const { data, error } = await db()
    .from("atlas_hq_team_members")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) return null;
  return mapMember(data as Record<string, unknown>);
}

export async function insertHqTeamMember(input: {
  userId: string;
  email: string;
  platformRole: string;
  status: HqTeamMemberStatus;
  invitedBy: string | null;
  customRoleId?: string | null;
}): Promise<HqTeamMemberRecord> {
  const { data, error } = await db()
    .from("atlas_hq_team_members")
    .insert({
      user_id: input.userId,
      email: input.email.toLowerCase(),
      platform_role: input.platformRole,
      status: input.status,
      invited_by: input.invitedBy,
      custom_role_id: input.customRoleId ?? null,
      activity_log: [
        {
          at: new Date().toISOString(),
          action: "created",
          by: input.invitedBy,
        },
      ],
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "insertHqTeamMember failed");
  return mapMember(data as Record<string, unknown>);
}

export async function updateHqTeamMemberRecord(input: {
  memberId: string;
  platformRole?: string;
  status?: HqTeamMemberStatus;
  customRoleId?: string | null;
  actorId?: string | null;
}): Promise<HqTeamMemberRecord | null> {
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.platformRole) patch.platform_role = input.platformRole;
  if (input.status) patch.status = input.status;
  if (input.customRoleId !== undefined) patch.custom_role_id = input.customRoleId;
  if (input.status === "deleted") patch.deleted_at = new Date().toISOString();

  const { data, error } = await db()
    .from("atlas_hq_team_members")
    .update(patch)
    .eq("id", input.memberId)
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  return mapMember(data as Record<string, unknown>);
}

export async function upsertWebsitePage(input: {
  slug: string;
  title: string;
  pageType: string;
  path: string;
  locale: string;
  status: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  content: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const { data, error } = await db()
    .from("atlas_hq_website_pages")
    .upsert(
      {
        slug: input.slug,
        title: input.title,
        page_type: input.pageType,
        path: input.path,
        locale: input.locale,
        status: input.status,
        seo_title: input.seoTitle ?? null,
        seo_description: input.seoDescription ?? null,
        content: input.content,
        updated_at: new Date().toISOString(),
        published_at:
          input.status === "published" ? new Date().toISOString() : null,
      },
      { onConflict: "slug" },
    )
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "upsertWebsitePage failed");
  return data as Record<string, unknown>;
}

export async function listWebsitePages(): Promise<Record<string, unknown>[]> {
  const { data, error } = await db()
    .from("atlas_hq_website_pages")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });
  if (error) return [];
  return (data ?? []) as Record<string, unknown>[];
}

export async function insertAnnouncement(
  input: HqAnnouncementDraft,
): Promise<Record<string, unknown>> {
  const { data, error } = await db()
    .from("atlas_hq_announcements")
    .insert({
      title: input.title,
      message: input.message,
      button_text: input.buttonText ?? null,
      button_url: input.buttonUrl ?? null,
      priority: input.priority ?? 0,
      background_color: input.backgroundColor ?? null,
      text_color: input.textColor ?? null,
      icon: input.icon ?? null,
      is_enabled: input.isEnabled ?? false,
      starts_at: input.startsAt ?? null,
      ends_at: input.endsAt ?? null,
      preview_payload: {
        title: input.title,
        message: input.message,
        buttonText: input.buttonText,
        buttonUrl: input.buttonUrl,
      },
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "insertAnnouncement failed");
  return data as Record<string, unknown>;
}

export async function updateAnnouncement(
  id: string,
  input: Partial<HqAnnouncementDraft>,
): Promise<Record<string, unknown> | null> {
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.title !== undefined) patch.title = input.title;
  if (input.message !== undefined) patch.message = input.message;
  if (input.buttonText !== undefined) patch.button_text = input.buttonText;
  if (input.buttonUrl !== undefined) patch.button_url = input.buttonUrl;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.backgroundColor !== undefined)
    patch.background_color = input.backgroundColor;
  if (input.textColor !== undefined) patch.text_color = input.textColor;
  if (input.icon !== undefined) patch.icon = input.icon;
  if (input.isEnabled !== undefined) patch.is_enabled = input.isEnabled;
  if (input.startsAt !== undefined) patch.starts_at = input.startsAt;
  if (input.endsAt !== undefined) patch.ends_at = input.endsAt;

  const { data, error } = await db()
    .from("atlas_hq_announcements")
    .update(patch)
    .eq("id", id)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  return data as Record<string, unknown>;
}

export async function listAnnouncements(): Promise<Record<string, unknown>[]> {
  const { data, error } = await db()
    .from("atlas_hq_announcements")
    .select("*")
    .is("deleted_at", null)
    .order("priority", { ascending: false });
  if (error) return [];
  return (data ?? []) as Record<string, unknown>[];
}

export async function getActiveAnnouncements(): Promise<Record<string, unknown>[]> {
  const now = new Date().toISOString();
  const { data, error } = await db()
    .from("atlas_hq_announcements")
    .select("*")
    .eq("is_enabled", true)
    .is("deleted_at", null)
    .order("priority", { ascending: false });
  if (error) return [];
  return (data ?? []).filter((row) => {
    const starts = row.starts_at as string | null;
    const ends = row.ends_at as string | null;
    if (starts && starts > now) return false;
    if (ends && ends < now) return false;
    return true;
  }) as Record<string, unknown>[];
}

export async function seedDefaultWebsitePages(
  pages: Array<{
    slug: string;
    title: string;
    path: string;
    pageType?: string;
  }>,
): Promise<void> {
  for (const page of pages) {
    await db()
      .from("atlas_hq_website_pages")
      .upsert(
        {
          slug: page.slug,
          title: page.title,
          path: page.path,
          page_type: page.pageType ?? "marketing",
          locale: "en",
          status: "draft",
          content: {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: "slug" },
      );
  }
}
