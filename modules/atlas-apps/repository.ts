import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AppApplication,
  AppCategory,
  AppInstall,
  AppPermissionDef,
  AppReview,
  AppVersion,
  DiscoverAppsQuery,
  InstallAppInput,
} from "./types";

function db() {
  return createAdminClient();
}

export async function getApplicationById(
  applicationId: string,
): Promise<AppApplication | null> {
  const { data } = await db()
    .from("atlas_apps_applications")
    .select("*")
    .eq("id", applicationId)
    .is("deleted_at", null)
    .maybeSingle();
  return (data as AppApplication | null) ?? null;
}

export async function getApplicationBySlug(
  slug: string,
): Promise<AppApplication | null> {
  const { data } = await db()
    .from("atlas_apps_applications")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  return (data as AppApplication | null) ?? null;
}

export async function listCategories(): Promise<AppCategory[]> {
  const { data } = await db()
    .from("atlas_apps_categories")
    .select("*")
    .order("sort_order");
  return (data as AppCategory[]) ?? [];
}

export async function discoverApplications(
  query: DiscoverAppsQuery,
): Promise<AppApplication[]> {
  let q = db()
    .from("atlas_apps_applications")
    .select("*")
    .eq("status", "published")
    .is("deleted_at", null)
    .order("install_count", { ascending: false })
    .limit(query.limit ?? 50);

  if (query.featuredOnly) q = q.eq("is_featured", true);
  if (query.verifiedOnly) q = q.eq("is_verified", true);
  if (query.query) {
    q = q.or(`name.ilike.%${query.query}%,description.ilike.%${query.query}%`);
  }
  if (query.categorySlug) {
    const { data: cat } = await db()
      .from("atlas_apps_categories")
      .select("id")
      .eq("slug", query.categorySlug)
      .maybeSingle();
    if (cat) q = q.eq("category_id", (cat as { id: string }).id);
  }

  const { data } = await q;
  return (data as AppApplication[]) ?? [];
}

export async function getPermissionDefs(
  applicationId: string,
): Promise<AppPermissionDef[]> {
  const { data } = await db()
    .from("atlas_apps_permission_defs")
    .select("*")
    .eq("application_id", applicationId);
  return (data as AppPermissionDef[]) ?? [];
}

export async function getLatestVersion(
  applicationId: string,
): Promise<AppVersion | null> {
  const { data } = await db()
    .from("atlas_apps_versions")
    .select("*")
    .eq("application_id", applicationId)
    .eq("is_latest", true)
    .maybeSingle();
  return (data as AppVersion | null) ?? null;
}

export async function getInstall(
  applicationId: string,
  businessId: string,
): Promise<AppInstall | null> {
  const { data } = await db()
    .from("atlas_apps_installs")
    .select("*")
    .eq("application_id", applicationId)
    .eq("business_id", businessId)
    .maybeSingle();
  return (data as AppInstall | null) ?? null;
}

export async function listInstallsByBusiness(
  businessId: string,
): Promise<AppInstall[]> {
  const { data } = await db()
    .from("atlas_apps_installs")
    .select("*")
    .eq("business_id", businessId)
    .neq("status", "uninstalled")
    .order("created_at", { ascending: false });
  return (data as AppInstall[]) ?? [];
}

export async function createInstallRecord(
  input: InstallAppInput & { version: string },
): Promise<AppInstall> {
  const existing = await getInstall(input.applicationId, input.businessId);
  if (existing && existing.status !== "uninstalled") {
    return existing;
  }

  if (existing?.status === "uninstalled") {
    const { data, error } = await db()
      .from("atlas_apps_installs")
      .update({
        status: "enabled",
        installed_by: input.installedBy,
        installed_version: input.version,
        previous_version: existing.installed_version,
        enabled_at: new Date().toISOString(),
        disabled_at: null,
        uninstalled_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to reinstall app");
    return data as AppInstall;
  }

  const { data, error } = await db()
    .from("atlas_apps_installs")
    .insert({
      application_id: input.applicationId,
      business_id: input.businessId,
      installed_by: input.installedBy,
      status: "enabled",
      installed_version: input.version,
      enabled_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to install app");

  await db()
    .from("atlas_apps_applications")
    .update({
      install_count: (
        await getApplicationById(input.applicationId)
      )!.install_count + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.applicationId);

  await db().from("atlas_apps_settings").insert({
    install_id: data.id,
    settings: {},
    storage: {},
  });

  const scopes =
    input.grantedScopes ??
    (await getPermissionDefs(input.applicationId)).map((p) => ({
      scope: p.scope,
      accessLevel: p.access_level,
    }));

  if (scopes.length) {
    await db().from("atlas_apps_install_permissions").insert(
      scopes.map((s) => ({
        install_id: data.id,
        scope: s.scope,
        access_level: s.accessLevel,
        granted: true,
        granted_by: input.installedBy,
      })),
    );
  }

  return data as AppInstall;
}

export async function updateInstallStatus(
  installId: string,
  status: string,
  patch?: Record<string, unknown>,
): Promise<AppInstall> {
  const { data, error } = await db()
    .from("atlas_apps_installs")
    .update({
      status,
      updated_at: new Date().toISOString(),
      ...patch,
    })
    .eq("id", installId)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to update install");
  return data as AppInstall;
}

export async function upgradeInstall(
  installId: string,
  toVersion: string,
  fromVersion: string | null,
): Promise<AppInstall> {
  return updateInstallStatus(installId, "enabled", {
    installed_version: toVersion,
    previous_version: fromVersion,
    enabled_at: new Date().toISOString(),
  });
}

export async function rollbackInstall(
  installId: string,
  previousVersion: string,
): Promise<AppInstall> {
  return updateInstallStatus(installId, "enabled", {
    installed_version: previousVersion,
    previous_version: null,
  });
}

export async function patchInstallSettings(
  installId: string,
  settingsPatch: Record<string, unknown>,
): Promise<void> {
  const { data } = await db()
    .from("atlas_apps_settings")
    .select("settings")
    .eq("install_id", installId)
    .maybeSingle();
  const current = ((data as { settings?: Record<string, unknown> } | null)?.settings ??
    {}) as Record<string, unknown>;
  await db()
    .from("atlas_apps_settings")
    .upsert({
      install_id: installId,
      settings: { ...current, ...settingsPatch },
      updated_at: new Date().toISOString(),
    });
}

export async function createReviewRecord(input: {
  applicationId: string;
  userId: string;
  businessId?: string;
  rating: number;
  title?: string;
  body?: string;
}): Promise<AppReview> {
  const { data, error } = await db()
    .from("atlas_apps_reviews")
    .upsert(
      {
        application_id: input.applicationId,
        user_id: input.userId,
        business_id: input.businessId ?? null,
        rating: input.rating,
        title: input.title ?? null,
        body: input.body ?? null,
        status: "approved",
      },
      { onConflict: "application_id,user_id" },
    )
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to submit review");

  const { data: reviews } = await db()
    .from("atlas_apps_reviews")
    .select("rating")
    .eq("application_id", input.applicationId)
    .eq("status", "approved");
  const ratings = (reviews as Array<{ rating: number }> | null) ?? [];
  const avg =
    ratings.length === 0
      ? 0
      : ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
  await db()
    .from("atlas_apps_applications")
    .update({
      rating_avg: avg,
      rating_count: ratings.length,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.applicationId);

  return data as AppReview;
}

export async function publishVersionRecord(input: {
  applicationId: string;
  version: string;
  changelog?: string;
  manifest: Record<string, unknown>;
}): Promise<AppVersion> {
  await db()
    .from("atlas_apps_versions")
    .update({ is_latest: false })
    .eq("application_id", input.applicationId);

  const { data, error } = await db()
    .from("atlas_apps_versions")
    .insert({
      application_id: input.applicationId,
      version: input.version,
      changelog: input.changelog ?? null,
      manifest: input.manifest,
      is_latest: true,
      published_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to publish version");

  await db()
    .from("atlas_apps_applications")
    .update({
      latest_version: input.version,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.applicationId);

  await db().from("atlas_apps_updates").insert({
    application_id: input.applicationId,
    to_version: input.version,
    release_notes: input.changelog ?? null,
  });

  return data as AppVersion;
}

export async function writeAuditLog(input: {
  action: string;
  applicationId?: string;
  installId?: string;
  businessId?: string;
  actorUserId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await db().from("atlas_apps_audit_logs").insert({
    action: input.action,
    application_id: input.applicationId ?? null,
    install_id: input.installId ?? null,
    business_id: input.businessId ?? null,
    actor_user_id: input.actorUserId ?? null,
    metadata: input.metadata ?? {},
  });
}

export async function createApiKeyRecord(input: {
  applicationId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  installId?: string;
  developerId?: string;
  scopes?: string[];
}): Promise<{ id: string; keyPrefix: string }> {
  const { data, error } = await db()
    .from("atlas_apps_api_keys")
    .insert({
      application_id: input.applicationId,
      install_id: input.installId ?? null,
      developer_id: input.developerId ?? null,
      name: input.name,
      key_prefix: input.keyPrefix,
      key_hash: input.keyHash,
      scopes: input.scopes ?? [],
    })
    .select("id, key_prefix")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create API key");
  const row = data as { id: string; key_prefix: string };
  return { id: row.id, keyPrefix: row.key_prefix };
}
