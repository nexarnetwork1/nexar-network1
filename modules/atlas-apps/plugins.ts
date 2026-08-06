/**
 * ATLAS Apps — plugin contracts (pure).
 * Future SDK implements these interfaces; foundation stores manifests as JSON.
 */

import type { AppPermissionScope } from "./types";

/** Manifest declared by an app package / developer. */
export type AppPluginManifest = {
  pluginApi: string;
  name: string;
  slug: string;
  version: string;
  entry?: string;
  permissions: Array<{
    scope: AppPermissionScope;
    accessLevel: "read" | "write" | "admin";
    reason?: string;
    required?: boolean;
  }>;
  webhooks?: Array<{ event: string; path: string }>;
  settingsSchema?: Record<string, unknown>;
  capabilities?: string[];
};

export type AppLifecycleHook =
  | "onInstall"
  | "onEnable"
  | "onDisable"
  | "onUpgrade"
  | "onRollback"
  | "onUninstall";

export type AppLifecycleContext = {
  businessId: string;
  installId: string;
  applicationId: string;
  version: string;
  previousVersion?: string | null;
  settings: Record<string, unknown>;
};

export type AppLifecycleResult = {
  ok: boolean;
  message?: string;
  settingsPatch?: Record<string, unknown>;
};

/** Sandbox isolation contract — runtime enforces later. */
export type AppSandboxPolicy = {
  networkEgress: "none" | "allowlist" | "open";
  allowlistHosts?: string[];
  maxStorageKb: number;
  maxCpuMs: number;
  permissionIsolation: true;
};

export const DEFAULT_SANDBOX_POLICY: AppSandboxPolicy = {
  networkEgress: "allowlist",
  allowlistHosts: [],
  maxStorageKb: 10_240,
  maxCpuMs: 5_000,
  permissionIsolation: true,
};

/** Stub lifecycle runner — real plugins plug in via SDK. */
export function runLifecycleStub(
  hook: AppLifecycleHook,
  context: AppLifecycleContext,
): AppLifecycleResult {
  return {
    ok: true,
    message: `stub:${hook}`,
    settingsPatch: {
      lastLifecycleHook: hook,
      lastLifecycleAt: new Date().toISOString(),
      version: context.version,
    },
  };
}

export function validateManifest(
  manifest: AppPluginManifest,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!manifest.pluginApi) errors.push("pluginApi required");
  if (!manifest.slug) errors.push("slug required");
  if (!manifest.version) errors.push("version required");
  if (!manifest.name) errors.push("name required");
  if (!Array.isArray(manifest.permissions)) errors.push("permissions required");
  return { valid: errors.length === 0, errors };
}

/** Developer publishing workflow states. */
export type AppPublishingStage =
  | "draft"
  | "submitted"
  | "in_review"
  | "approved"
  | "rejected"
  | "published";

export type DeveloperPublishRequest = {
  applicationId: string;
  version: string;
  changelog?: string;
  manifest: AppPluginManifest;
};
