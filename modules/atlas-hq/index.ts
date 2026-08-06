/**
 * NEXAR HQ — sole internal administration module of ATLAS.
 */

export {
  PLATFORM_OWNER_EMAIL,
  NEXAR_NETWORK_BUSINESS,
  HQ_STAFF_ROLES,
  HQ_WEBSITE_PAGE_KEYS,
  HQ_MODULE_SECTIONS,
  HQ_ROLE_DASHBOARDS,
  HQ_EVENT_HANDLERS,
} from "./types";

export type {
  HqStaffRole,
  HqTeamMemberStatus,
  HqWebsitePageKey,
  HqModuleSectionId,
  PlatformOwnerRecord,
  HqTeamMemberRecord,
  HqAnnouncementDraft,
  HqSessionContext,
} from "./types";

export {
  normalizeHqEmail,
  isPlatformOwnerEmail,
  isPlatformOwnerRole,
  canSeeNexarHq,
  assertCanMutatePlatformOwner,
  isHqStaffRole,
  dashboardsForStaffRole,
  atlasSidebarModules,
  resolvePostLoginPath,
} from "./founder";

export {
  ensureNexarHqBootstrap,
  runPlatformOwnerWizard,
} from "./bootstrap";

export {
  resolveHqSessionContext,
  recordPlatformOwnerLogin,
  completePlatformOwnerPasswordChange,
  completePlatformOwner2fa,
  listTeamForManagement,
  addHqTeamMember,
  updateHqTeamMember,
  createHqAnnouncement,
  updateHqAnnouncement,
  upsertHqWebsitePage,
  getHqWebsiteCatalog,
  getHqAnnouncementCenter,
  getPublicAnnouncementBar,
  createAtlasHqPort,
} from "./service";

export { resolvePostLoginPath as resolveHqPostLoginPath } from "./founder";

export { registerAtlasHqEventHandlers } from "./events";
