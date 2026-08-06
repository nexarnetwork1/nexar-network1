/**
 * NEXAR HQ — types & contracts.
 * Sole internal administration capability of ATLAS (not a separate product).
 */

/** Permanent founder identity — never appears in Team Management. */
export const PLATFORM_OWNER_EMAIL = "admin@nexarnetwork.org" as const;

export const NEXAR_NETWORK_BUSINESS = {
  legalName: "NEXAR NETWORK",
  displayName: "NEXAR NETWORK",
  slug: "nexar-network",
} as const;

/** HQ staff roles — each sees only assigned dashboards. */
export const HQ_STAFF_ROLES = [
  "support",
  "finance",
  "developer",
  "devops",
  "marketing",
  "content",
  "verification",
  "moderator",
  "security",
  "analytics",
  "apps",
  "custom",
] as const;

export type HqStaffRole = (typeof HQ_STAFF_ROLES)[number];

export type HqTeamMemberStatus = "active" | "disabled" | "invited" | "deleted";

export type HqWebsitePageStatus = "draft" | "published" | "archived";

/** Canonical public website surfaces editable from NEXAR HQ. */
export const HQ_WEBSITE_PAGE_KEYS = [
  "home",
  "announcement_bar",
  "hero",
  "features",
  "solutions",
  "products",
  "pricing",
  "whitepaper",
  "roadmap",
  "documentation",
  "api_docs",
  "developers",
  "blog",
  "news",
  "announcements",
  "partners",
  "investors",
  "careers",
  "help_center",
  "faq",
  "contact",
  "terms",
  "privacy",
  "cookies",
  "header",
  "footer",
  "navigation",
  "seo",
  "landing_pages",
  "email_templates",
  "cms",
  "media_library",
  "languages",
  "menus",
] as const;

export type HqWebsitePageKey = (typeof HQ_WEBSITE_PAGE_KEYS)[number];

/** NEXAR HQ module tree (architecture — UI deferred). */
export const HQ_MODULE_SECTIONS = [
  { id: "dashboard", label: "Dashboard", capabilities: ["Overview", "Alerts"] },
  {
    id: "platform",
    label: "Platform",
    capabilities: [
      "Businesses",
      "Users",
      "Subscriptions",
      "Marketplace",
      "Orders",
      "Payments",
      "Finance",
      "Analytics",
      "AI",
      "Apps",
      "Developers",
      "Verification",
      "Support",
      "Notifications",
      "Audit Logs",
      "Monitoring",
      "Servers",
      "Queues",
      "Storage",
      "Security",
    ],
  },
  {
    id: "website",
    label: "Website",
    capabilities: [...HQ_WEBSITE_PAGE_KEYS],
  },
  { id: "company", label: "Company", capabilities: ["NEXAR NETWORK profile"] },
  { id: "team", label: "Team", capabilities: ["Members", "Roles", "Activity"] },
  { id: "analytics", label: "Analytics", capabilities: ["Platform KPIs"] },
  { id: "finance", label: "Finance", capabilities: ["Treasury", "Fees", "Payouts"] },
  { id: "marketplace", label: "Marketplace", capabilities: ["Listings", "Moderation"] },
  { id: "support", label: "Support", capabilities: ["Tickets", "Contact"] },
  { id: "verification", label: "Verification", capabilities: ["Business KYC"] },
  { id: "ai", label: "AI", capabilities: ["Platform AI ops"] },
  { id: "apps", label: "Apps", capabilities: ["App store ops"] },
  { id: "developers", label: "Developers", capabilities: ["API keys", "Webhooks"] },
  {
    id: "infrastructure",
    label: "Infrastructure",
    capabilities: ["Servers", "Queues", "Storage", "Health"],
  },
  { id: "security", label: "Security", capabilities: ["Sessions", "2FA", "Audit"] },
  { id: "settings", label: "Settings", capabilities: ["Platform config"] },
] as const;

export type HqModuleSectionId = (typeof HQ_MODULE_SECTIONS)[number]["id"];

/** Default dashboard visibility per staff role. */
export const HQ_ROLE_DASHBOARDS: Record<HqStaffRole, readonly HqModuleSectionId[]> = {
  support: ["dashboard", "support", "verification"],
  finance: ["dashboard", "finance", "analytics", "platform"],
  developer: ["dashboard", "developers", "apps", "infrastructure"],
  devops: ["dashboard", "infrastructure", "security", "platform"],
  marketing: ["dashboard", "website", "analytics"],
  content: ["dashboard", "website"],
  verification: ["dashboard", "verification", "support"],
  moderator: ["dashboard", "marketplace", "support", "security"],
  security: ["dashboard", "security", "infrastructure", "team"],
  analytics: ["dashboard", "analytics", "platform"],
  apps: ["dashboard", "apps", "developers"],
  custom: ["dashboard"],
};

export type PlatformOwnerRecord = {
  id: string;
  userId: string;
  email: string;
  isPermanent: boolean;
  mustChangePassword: boolean;
  mustEnable2fa: boolean;
  passwordChangedAt: string | null;
  totpEnabled: boolean;
  firstLoginAt: string | null;
  lastLoginAt: string | null;
  hqEnabled: boolean;
};

export type HqTeamMemberRecord = {
  id: string;
  userId: string;
  email: string;
  platformRole: HqStaffRole | string;
  status: HqTeamMemberStatus;
  customRoleId: string | null;
  lastLoginAt: string | null;
  activityLog: unknown[];
};

export type HqAnnouncementDraft = {
  title: string;
  message: string;
  buttonText?: string | null;
  buttonUrl?: string | null;
  priority?: number;
  backgroundColor?: string | null;
  textColor?: string | null;
  icon?: string | null;
  isEnabled?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
};

export type HqSessionContext = {
  userId: string;
  isPlatformOwner: boolean;
  hqEnabled: boolean;
  hqVisibleInSidebar: boolean;
  nexarBusinessId: string | null;
  nexarWorkspaceId: string | null;
  staffRole: HqStaffRole | "platform_owner" | null;
  allowedSections: readonly HqModuleSectionId[];
  mustChangePassword: boolean;
  mustEnable2fa: boolean;
};

export const HQ_EVENT_HANDLERS = {
  "hq.bootstrapped": { action: "audit", description: "Platform initialized" },
  "hq.owner_login": { action: "session", description: "Platform Owner signed in" },
  "hq.team_member_added": { action: "audit", description: "HQ team member added" },
  "hq.announcement_updated": { action: "cms", description: "Announcement center changed" },
  "hq.website_page_updated": { action: "cms", description: "Website page updated" },
} as const;
