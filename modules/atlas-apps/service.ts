import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { publishDomainEvent, type DomainEvent } from "@/domains";
import type {
  AtlasAppsPort,
  AppApplicationRecord,
  AppInstallRecord,
} from "@/domains/contracts/ports";
import {
  DEFAULT_SANDBOX_POLICY,
  runLifecycleStub,
  validateManifest,
  type AppPluginManifest,
} from "./plugins";
import { recommendApps, recommendStarterApps } from "./recommendations";
import {
  createApiKeyRecord,
  createInstallRecord,
  createReviewRecord,
  discoverApplications,
  getApplicationById,
  getApplicationBySlug,
  getInstall,
  getLatestVersion,
  getPermissionDefs,
  listCategories,
  listInstallsByBusiness,
  patchInstallSettings,
  publishVersionRecord,
  rollbackInstall,
  updateInstallStatus,
  upgradeInstall,
  writeAuditLog,
} from "./repository";
import type {
  AppApplication,
  AppCategorySlug,
  AppInstall,
  DiscoverAppsQuery,
  InstallAppInput,
} from "./types";
import {
  discoverAppsSchema,
  installAppSchema,
  publishVersionSchema,
  submitReviewSchema,
} from "./validators";

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

function toAppRecord(app: AppApplication): AppApplicationRecord {
  return {
    id: app.id,
    slug: app.slug,
    name: app.name,
    status: app.status,
    pricingModel: app.pricing_model,
    isSystem: app.is_system,
    isFeatured: app.is_featured,
    isVerified: app.is_verified,
    installCount: app.install_count,
    ratingAvg: app.rating_avg,
    latestVersion: app.latest_version,
  };
}

function toInstallRecord(install: AppInstall): AppInstallRecord {
  return {
    id: install.id,
    applicationId: install.application_id,
    businessId: install.business_id,
    status: install.status,
    installedVersion: install.installed_version,
    previousVersion: install.previous_version,
  };
}

export async function discoverApps(
  query: DiscoverAppsQuery = {},
): Promise<AppApplicationRecord[]> {
  discoverAppsSchema.parse(query);
  const apps = await discoverApplications(query);
  return apps.map(toAppRecord);
}

export async function getAppBySlug(
  slug: string,
): Promise<AppApplicationRecord | null> {
  const app = await getApplicationBySlug(slug);
  return app ? toAppRecord(app) : null;
}

export async function listBusinessApps(
  businessId: string,
): Promise<AppInstallRecord[]> {
  const installs = await listInstallsByBusiness(businessId);
  return installs.map(toInstallRecord);
}

export async function installApp(
  input: InstallAppInput,
): Promise<AppInstallRecord> {
  installAppSchema.parse(input);

  const app = await getApplicationById(input.applicationId);
  if (!app || app.deleted_at) throw new Error("Application not found");
  if (app.status !== "published" && !app.is_system) {
    throw new Error("Application is not available for install");
  }

  const version =
    input.version ??
    app.latest_version ??
    (await getLatestVersion(app.id))?.version ??
    "1.0.0";

  const install = await createInstallRecord({ ...input, version });

  const lifecycle = runLifecycleStub("onInstall", {
    businessId: input.businessId,
    installId: install.id,
    applicationId: app.id,
    version,
    settings: {},
  });
  if (lifecycle.settingsPatch) {
    await patchInstallSettings(install.id, lifecycle.settingsPatch);
  }

  await writeAuditLog({
    action: "install",
    applicationId: app.id,
    installId: install.id,
    businessId: input.businessId,
    actorUserId: input.installedBy,
    metadata: { version },
  });

  await emit("apps.application_installed", {
    actorId: input.installedBy,
    businessId: input.businessId,
    payload: {
      applicationId: app.id,
      installId: install.id,
      slug: app.slug,
      version,
    },
  });

  return toInstallRecord(install);
}

export async function enableApp(
  applicationId: string,
  businessId: string,
  actorUserId: string,
): Promise<AppInstallRecord> {
  const install = await getInstall(applicationId, businessId);
  if (!install || install.status === "uninstalled") {
    throw new Error("App is not installed");
  }

  const updated = await updateInstallStatus(install.id, "enabled", {
    enabled_at: new Date().toISOString(),
    disabled_at: null,
  });

  runLifecycleStub("onEnable", {
    businessId,
    installId: install.id,
    applicationId,
    version: install.installed_version ?? "0.0.0",
    settings: {},
  });

  await writeAuditLog({
    action: "enable",
    applicationId,
    installId: install.id,
    businessId,
    actorUserId,
  });

  await emit("apps.application_enabled", {
    actorId: actorUserId,
    businessId,
    payload: { applicationId, installId: install.id },
  });

  return toInstallRecord(updated);
}

export async function disableApp(
  applicationId: string,
  businessId: string,
  actorUserId: string,
): Promise<AppInstallRecord> {
  const install = await getInstall(applicationId, businessId);
  if (!install || install.status === "uninstalled") {
    throw new Error("App is not installed");
  }

  const updated = await updateInstallStatus(install.id, "disabled", {
    disabled_at: new Date().toISOString(),
  });

  runLifecycleStub("onDisable", {
    businessId,
    installId: install.id,
    applicationId,
    version: install.installed_version ?? "0.0.0",
    settings: {},
  });

  await writeAuditLog({
    action: "disable",
    applicationId,
    installId: install.id,
    businessId,
    actorUserId,
  });

  await emit("apps.application_disabled", {
    actorId: actorUserId,
    businessId,
    payload: { applicationId, installId: install.id },
  });

  return toInstallRecord(updated);
}

export async function upgradeApp(
  applicationId: string,
  businessId: string,
  actorUserId: string,
  toVersion?: string,
): Promise<AppInstallRecord> {
  const install = await getInstall(applicationId, businessId);
  if (!install || install.status === "uninstalled") {
    throw new Error("App is not installed");
  }

  const latest = await getLatestVersion(applicationId);
  const target = toVersion ?? latest?.version;
  if (!target) throw new Error("No version available to upgrade");

  const fromVersion = install.installed_version;
  await updateInstallStatus(install.id, "upgrading");
  const updated = await upgradeInstall(install.id, target, fromVersion);

  runLifecycleStub("onUpgrade", {
    businessId,
    installId: install.id,
    applicationId,
    version: target,
    previousVersion: fromVersion,
    settings: {},
  });

  await writeAuditLog({
    action: "upgrade",
    applicationId,
    installId: install.id,
    businessId,
    actorUserId,
    metadata: { fromVersion, toVersion: target },
  });

  await emit("apps.application_updated", {
    actorId: actorUserId,
    businessId,
    payload: {
      applicationId,
      installId: install.id,
      fromVersion,
      toVersion: target,
    },
  });

  return toInstallRecord(updated);
}

export async function rollbackApp(
  applicationId: string,
  businessId: string,
  actorUserId: string,
): Promise<AppInstallRecord> {
  const install = await getInstall(applicationId, businessId);
  if (!install?.previous_version) {
    throw new Error("No previous version to roll back to");
  }

  const previous = install.previous_version;
  const updated = await rollbackInstall(install.id, previous);

  runLifecycleStub("onRollback", {
    businessId,
    installId: install.id,
    applicationId,
    version: previous,
    previousVersion: install.installed_version,
    settings: {},
  });

  await writeAuditLog({
    action: "rollback",
    applicationId,
    installId: install.id,
    businessId,
    actorUserId,
    metadata: { toVersion: previous },
  });

  await emit("apps.application_updated", {
    actorId: actorUserId,
    businessId,
    payload: {
      applicationId,
      installId: install.id,
      toVersion: previous,
      rollback: true,
    },
  });

  return toInstallRecord(updated);
}

export async function uninstallApp(
  applicationId: string,
  businessId: string,
  actorUserId: string,
): Promise<AppInstallRecord> {
  const install = await getInstall(applicationId, businessId);
  if (!install || install.status === "uninstalled") {
    throw new Error("App is not installed");
  }

  const updated = await updateInstallStatus(install.id, "uninstalled", {
    uninstalled_at: new Date().toISOString(),
    disabled_at: new Date().toISOString(),
  });

  runLifecycleStub("onUninstall", {
    businessId,
    installId: install.id,
    applicationId,
    version: install.installed_version ?? "0.0.0",
    settings: {},
  });

  await writeAuditLog({
    action: "uninstall",
    applicationId,
    installId: install.id,
    businessId,
    actorUserId,
  });

  await emit("apps.application_removed", {
    actorId: actorUserId,
    businessId,
    payload: { applicationId, installId: install.id },
  });

  return toInstallRecord(updated);
}

export async function submitAppReview(input: {
  applicationId: string;
  userId: string;
  businessId?: string;
  rating: number;
  title?: string;
  body?: string;
}) {
  submitReviewSchema.parse(input);
  return createReviewRecord(input);
}

export async function publishAppVersion(input: {
  applicationId: string;
  version: string;
  changelog?: string;
  manifest: Record<string, unknown>;
  developerId: string;
}) {
  publishVersionSchema.parse(input);
  const check = validateManifest(input.manifest as AppPluginManifest);
  if (!check.valid) {
    throw new Error(`Invalid manifest: ${check.errors.join(", ")}`);
  }
  const version = await publishVersionRecord(input);
  await writeAuditLog({
    action: "publish_version",
    applicationId: input.applicationId,
    actorUserId: input.developerId,
    metadata: { version: input.version },
  });
  return version;
}

export async function createAppApiKey(input: {
  applicationId: string;
  name: string;
  installId?: string;
  developerId?: string;
  scopes?: string[];
}): Promise<{ id: string; keyPrefix: string; secret: string }> {
  const secret = `nxa_${randomBytes(24).toString("hex")}`;
  const keyPrefix = secret.slice(0, 12);
  const keyHash = createHash("sha256").update(secret).digest("hex");
  const record = await createApiKeyRecord({
    ...input,
    keyPrefix,
    keyHash,
  });
  return { id: record.id, keyPrefix: record.keyPrefix, secret };
}

export async function recommendAppsForBusiness(input: {
  businessId: string;
  industry?: string | null;
  hasProducts?: boolean;
  hasOrders?: boolean;
  employeeCount?: number;
  limit?: number;
}): Promise<
  Array<{
    applicationId: string;
    slug: string;
    score: number;
    reason: string;
  }>
> {
  const [catalog, installs] = await Promise.all([
    discoverApplications({ limit: 100 }),
    listInstallsByBusiness(input.businessId),
  ]);
  const categories = await listCategories();
  const catById = new Map(categories.map((c) => [c.id, c.slug]));

  const installedSlugs: string[] = [];
  for (const i of installs) {
    const app = await getApplicationById(i.application_id);
    if (app) installedSlugs.push(app.slug);
  }

  const scored = recommendApps(
    {
      industry: input.industry,
      hasProducts: input.hasProducts,
      hasOrders: input.hasOrders,
      employeeCount: input.employeeCount,
      installedSlugs,
    },
    catalog.map((a) => ({
      applicationId: a.id,
      slug: a.slug,
      categorySlug: (a.category_id
        ? catById.get(a.category_id)
        : "other") as AppCategorySlug,
      baseScore: a.install_count,
      isFeatured: a.is_featured,
      isVerified: a.is_verified,
    })),
  );

  return scored.slice(0, input.limit ?? 10).map((s) => ({
    applicationId: s.applicationId,
    slug: s.slug,
    score: s.score,
    reason: s.reason,
  }));
}

export async function handleAppsDomainEvent(input: {
  name: string;
  actorId: string | null;
  businessId: string | null;
  payload: Record<string, unknown>;
}): Promise<void> {
  if (input.name === "business.created" && input.businessId) {
    await writeAuditLog({
      action: "recommend_starter",
      businessId: input.businessId,
      actorUserId: input.actorId ?? undefined,
      metadata: { starterCategories: recommendStarterApps() },
    });
    return;
  }

  if (
    (input.name === "product.published" || input.name === "order.paid") &&
    input.businessId
  ) {
    await writeAuditLog({
      action: "recommend_signal",
      businessId: input.businessId,
      actorUserId: input.actorId ?? undefined,
      metadata: { signal: input.name, ...input.payload },
    });
  }
}

export function createAtlasAppsPort(): AtlasAppsPort {
  return {
    async discover(query) {
      return discoverApps(query as DiscoverAppsQuery | undefined);
    },
    async getBySlug(slug) {
      return getAppBySlug(slug);
    },
    async listInstalled(businessId) {
      return listBusinessApps(businessId);
    },
    async install(input) {
      return installApp(input as InstallAppInput);
    },
    async enable(applicationId, businessId, actorUserId) {
      return enableApp(applicationId, businessId, actorUserId);
    },
    async disable(applicationId, businessId, actorUserId) {
      return disableApp(applicationId, businessId, actorUserId);
    },
    async uninstall(applicationId, businessId, actorUserId) {
      return uninstallApp(applicationId, businessId, actorUserId);
    },
    async recommend(input) {
      return recommendAppsForBusiness(input);
    },
  };
}

export {
  DEFAULT_SANDBOX_POLICY,
  runLifecycleStub,
  validateManifest,
  recommendApps,
  recommendStarterApps,
  listCategories,
  getPermissionDefs,
  getLatestVersion,
};
