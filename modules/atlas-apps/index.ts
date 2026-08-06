/**
 * ATLAS Apps — Business Applications Platform.
 * Expandable BOS plugin layer — not a fixed ERP.
 */

export type {
  AppApplication,
  AppInstall,
  AppCategory,
  AppDeveloper,
  AppVersion,
  AppPermissionDef,
  AppReview,
  AppSubscription,
  AppCategorySlug,
  AppPermissionScope,
  AppPricingModel,
  AppStatus,
  AppInstallStatus,
  InstallAppInput,
  DiscoverAppsQuery,
} from "./types";

export { SYSTEM_APP_SLUGS, APPS_EVENT_HANDLERS } from "./types";

export type {
  AppPluginManifest,
  AppLifecycleHook,
  AppLifecycleContext,
  AppLifecycleResult,
  AppSandboxPolicy,
  AppPublishingStage,
  DeveloperPublishRequest,
} from "./plugins";

export {
  DEFAULT_SANDBOX_POLICY,
  runLifecycleStub,
  validateManifest,
} from "./plugins";

export { recommendApps, recommendStarterApps } from "./recommendations";

export {
  discoverApps,
  getAppBySlug,
  listBusinessApps,
  installApp,
  enableApp,
  disableApp,
  upgradeApp,
  rollbackApp,
  uninstallApp,
  submitAppReview,
  publishAppVersion,
  createAppApiKey,
  recommendAppsForBusiness,
  handleAppsDomainEvent,
  createAtlasAppsPort,
  listCategories,
  getPermissionDefs,
  getLatestVersion,
} from "./service";

export { registerAtlasAppsEventHandlers } from "./events";

export {
  installAppSchema,
  discoverAppsSchema,
  submitReviewSchema,
  publishVersionSchema,
  appPermissionScopeSchema,
  appCategorySlugSchema,
} from "./validators";
