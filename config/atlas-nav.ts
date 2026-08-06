/**
 * ATLAS root navigation architecture (Phase 1).
 *
 * Canonical module tree for the platform shell. Existing portal nav
 * (`config/dashboard-nav.ts`) remains operational; this file defines how
 * every future module plugs into ATLAS without route changes yet.
 */

import type { BoundedContextId } from "@/domains/map";

export type AtlasModuleStatus = "active" | "foundation" | "planned";

export type AtlasRootModule = {
  /** Stable module id — used in permissions, analytics, and routing later. */
  id: string;
  label: string;
  description: string;
  status: AtlasModuleStatus;
  /** Primary route when the module is navigable today. */
  href?: string;
  /** Maps to DDD bounded context (internal key, e.g. businessHub). */
  boundedContext?: BoundedContextId;
  /** Capability areas inside the module (documentation / future nav). */
  capabilities: readonly string[];
};

/**
 * Official ATLAS module tree — every module belongs here.
 * Business Hub is the **Business** capability; Marketplace is a sales channel only.
 */
export const ATLAS_ROOT_MODULES: readonly AtlasRootModule[] = [
  {
    id: "home",
    label: "Home",
    description: "Platform entry, dashboard, and cross-module overview.",
    status: "active",
    href: "/dashboard",
    capabilities: ["Overview", "Notifications", "Quick actions"],
  },
  {
    id: "core",
    label: "Core",
    description:
      "Integration spine — event bus, outbox, timeline, search, notification hub, analytics bridge.",
    status: "foundation",
    boundedContext: "atlasCore",
    capabilities: [
      "Orchestration",
      "Outbox",
      "Timeline",
      "Search Index",
      "Notification Hub",
      "Analytics Facts",
    ],
  },
  {
    id: "business",
    label: "Business",
    description:
      "Company aggregate — profile, stores, products, employees, verification, settings, membership, permissions.",
    status: "foundation",
    href: "/merchant",
    boundedContext: "businessHub",
    capabilities: [
      "Business Profile",
      "Stores",
      "Products",
      "Services",
      "Employees",
      "Verification",
      "Business Settings",
      "Membership",
      "Permissions",
      "Business Wallet",
      "Business Analytics",
      "Business AI Context",
    ],
  },
  {
    id: "marketplace",
    label: "Marketplace",
    description:
      "Commerce Engine — storefronts, listings, checkout, promotions. Sales channel only; Product masters live in Business.",
    status: "foundation",
    href: "/marketplace",
    boundedContext: "marketplace",
    capabilities: [
      "Storefronts",
      "Listings",
      "Cart",
      "Checkout",
      "Wishlist",
      "Offers",
      "Campaigns",
      "Shipments",
      "Discovery",
      "Reviews",
    ],
  },
  {
    id: "network",
    label: "Network",
    description: "Business Social Network — profiles, connections, posts, discovery.",
    status: "foundation",
    boundedContext: "atlasNetwork",
    capabilities: [
      "Profiles",
      "Company Pages",
      "Connections",
      "Follow",
      "Feed",
      "Posts",
      "Discovery",
      "Search",
    ],
  },
  {
    id: "feed",
    label: "Pulse",
    description: "Business Intelligence Feed — real-time activity, trending, AI insights.",
    status: "foundation",
    boundedContext: "atlasPulse",
    capabilities: [
      "Timeline",
      "Feed Items",
      "Trending",
      "Recommendations",
      "Articles",
      "AI Insights",
      "Analytics",
    ],
  },
  {
    id: "connect",
    label: "Connect",
    description:
      "Business Collaboration Platform — workspaces, channels, meetings, smart actions. Not a chat app.",
    status: "foundation",
    boundedContext: "atlasConnect",
    capabilities: [
      "Workspaces",
      "Channels",
      "Conversations",
      "Meetings",
      "Tasks",
      "Approvals",
      "Shared Files",
      "Smart Actions",
      "AI Assist",
    ],
  },
  {
    id: "wallet",
    label: "Wallet",
    description: "Fiat balances, ledger, withdrawals — platform money movement.",
    status: "active",
    href: "/merchant/wallet",
    boundedContext: "wallet",
    capabilities: ["Balances", "Withdrawals", "On-chain settlement"],
  },
  {
    id: "nxr",
    label: "NXR",
    description:
      "Digital economy — utility token for subscriptions, rewards, premiums. Blockchain optional.",
    status: "foundation",
    boundedContext: "nxrToken",
    capabilities: [
      "NXR Accounts",
      "Transfers",
      "Rewards",
      "Loyalty",
      "Premium Features",
      "AI Credits",
      "Treasury",
      "Token Payments",
    ],
  },
  {
    id: "ai",
    label: "AI",
    description:
      "Business Intelligence Engine — agents, workflows, knowledge, insights. Not a chatbot.",
    status: "foundation",
    boundedContext: "atlasAi",
    capabilities: [
      "Agents",
      "Workflows",
      "Knowledge",
      "Memory",
      "Insights",
      "Predictions",
      "Reports",
      "Automations",
      "Semantic Search",
    ],
  },
  {
    id: "apps",
    label: "Apps",
    description:
      "Business Applications Platform — installable CRM, HR, Finance, Inventory, and industry apps. Expandable BOS, not a fixed ERP.",
    status: "foundation",
    boundedContext: "atlasApps",
    capabilities: [
      "App Store",
      "Installed Apps",
      "App Settings",
      "App Permissions",
      "Versions",
      "Developer Console",
      "Subscriptions",
      "Reviews",
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Business and platform metrics derived from domain events.",
    status: "active",
    href: "/merchant/analytics",
    boundedContext: "analytics",
    capabilities: ["Dashboards", "Reports", "Live metrics"],
  },
  {
    id: "documents",
    label: "Documents",
    description: "Contracts, files, versions, e-signatures.",
    status: "planned",
    boundedContext: "documents",
    capabilities: ["Upload", "Versioning", "Signatures"],
  },
  {
    id: "crm",
    label: "CRM",
    description:
      "Customers, leads, pipeline — delivered as installable Apps on Business data.",
    status: "foundation",
    href: "/merchant/customers",
    boundedContext: "atlasApps",
    capabilities: ["Customers", "Leads", "Pipeline"],
  },
  {
    id: "hr",
    label: "HR",
    description: "Teams, roles, hiring — Employee master owned by Business.",
    status: "planned",
    boundedContext: "employees",
    capabilities: ["Teams", "Roles", "Hiring"],
  },
  {
    id: "finance",
    label: "Finance",
    description:
      "Financial Operating System — GL, journals, tax, budgets, reports. Payment rails remain under Payments/Wallet.",
    status: "foundation",
    href: "/merchant/revenue",
    boundedContext: "atlasFinance",
    capabilities: [
      "Chart of Accounts",
      "Journals",
      "Expenses",
      "Budgets",
      "Tax",
      "Reports",
      "Subscriptions",
      "Refunds",
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    description: "Stock and catalog operations — Product master owned by Business.",
    status: "active",
    href: "/merchant/products",
    boundedContext: "catalog",
    capabilities: ["Products", "Categories", "Stock"],
  },
  {
    id: "mobile",
    label: "Mobile",
    description:
      "Complete mobile platform — offline-first sync, push, devices, camera, deep links. Same business data as desktop.",
    status: "foundation",
    boundedContext: "atlasMobile",
    capabilities: [
      "Devices",
      "Offline Sync",
      "Push",
      "Deep Links",
      "Camera / OCR",
      "Location",
      "Dashboard Widgets",
      "Biometrics",
    ],
  },
  {
    id: "api",
    label: "API",
    description: "Public API, webhooks, integrations.",
    status: "foundation",
    href: "/merchant/webhooks",
    boundedContext: "api",
    capabilities: ["API Keys", "Webhooks", "Integrations"],
  },
  {
    id: "settings",
    label: "Settings",
    description: "User, business, and platform configuration.",
    status: "active",
    href: "/merchant/profile",
    boundedContext: "settings",
    capabilities: ["Profile", "Preferences", "Platform config"],
  },
  {
    id: "nexar-hq",
    label: "NEXAR HQ",
    description:
      "Internal platform administration — Platform, Website, Team, Security. Customers never see this module.",
    status: "foundation",
    href: "/admin/dashboard",
    boundedContext: "atlasHq",
    capabilities: [
      "Dashboard",
      "Platform",
      "Website",
      "Company",
      "Team",
      "Analytics",
      "Finance",
      "Marketplace",
      "Support",
      "Verification",
      "AI",
      "Apps",
      "Developers",
      "Infrastructure",
      "Security",
      "Settings",
    ],
  },
] as const;

export type AtlasRootModuleId = (typeof ATLAS_ROOT_MODULES)[number]["id"];

export function getAtlasModule(id: AtlasRootModuleId): AtlasRootModule | undefined {
  return ATLAS_ROOT_MODULES.find((m) => m.id === id);
}

export function getActiveAtlasModules(): AtlasRootModule[] {
  return ATLAS_ROOT_MODULES.filter((m) => m.status === "active" || m.status === "foundation");
}

export function getPlannedAtlasModules(): AtlasRootModule[] {
  return ATLAS_ROOT_MODULES.filter((m) => m.status === "planned");
}

// ---------------------------------------------------------------------------
// Shell adapter — converts ATLAS_ROOT_MODULES into DashboardNavSection[]
// so the existing DashboardShell can render the unified ATLAS workspace.
//
// Rules:
//   • Only modules with an href and status !== "planned" are shown.
//   • The platform_owner / super_admin / admin roles always get the HQ module.
//   • Non-admin roles never see the HQ module.
//   • No routes are invented here; every href comes from ATLAS_ROOT_MODULES.
// ---------------------------------------------------------------------------

import type { DashboardNavSection, DashboardNavItem, DashboardIconName } from "./dashboard-nav";

/** Maps ATLAS module ids to sidebar icon names from the existing icon registry. */
const MODULE_ICONS: Partial<Record<string, DashboardIconName>> = {
  home: "home",
  business: "building",
  marketplace: "store",
  finance: "chart",
  network: "users",
  feed: "activity",
  connect: "layers",
  wallet: "wallet",
  nxr: "coins",
  ai: "gauge",
  apps: "boxes",
  analytics: "gauge",
  crm: "users",
  inventory: "package",
  api: "webhook",
  settings: "cog",
  "nexar-hq": "shield",
};

type AtlasNavRole =
  | "customer"
  | "merchant"
  | "business"
  | "admin"
  | "super_admin"
  | "platform_owner"
  | string;

/** Module ids visible to business roles (merchant / business). */
const BUSINESS_MODULE_IDS = new Set([
  "home",
  "business",
  "marketplace",
  "finance",
  "network",
  "feed",
  "connect",
  "wallet",
  "nxr",
  "ai",
  "apps",
  "inventory",
  "crm",
  "api",
  "settings",
]);

/** Module ids visible to customers. */
const CUSTOMER_MODULE_IDS = new Set([
  "home",
  "marketplace",
  "wallet",
  "settings",
]);

/** Module ids visible to admin / HQ roles — the full set minus nothing. */
const ADMIN_MODULE_IDS = new Set(
  ATLAS_ROOT_MODULES.filter((m) => m.status !== "planned").map((m) => m.id),
);

function allowedIds(role: AtlasNavRole): Set<string> {
  if (role === "admin" || role === "super_admin" || role === "platform_owner") {
    return ADMIN_MODULE_IDS;
  }
  if (role === "merchant" || role === "business") {
    return BUSINESS_MODULE_IDS;
  }
  return CUSTOMER_MODULE_IDS;
}

/**
 * Returns `DashboardNavSection[]` for the ATLAS workspace shell.
 *
 * Reads module definitions exclusively from `ATLAS_ROOT_MODULES` — the single
 * source of truth for labels and descriptions. Routes are mapped to their
 * /dashboard/* counterparts so navigation stays inside the ATLAS shell.
 * The legacy module hrefs (/merchant, /admin/dashboard etc.) are preserved
 * unchanged for backward-compatibility; only the sidebar uses /dashboard/*.
 */
export function atlasNavSections(role: AtlasNavRole = "customer"): DashboardNavSection[] {
  const allowed = allowedIds(role);

  // Map each module id to its /dashboard/* route.
  // Modules with no /dashboard/* route yet fall back to their legacy href.
  const DASHBOARD_ROUTES: Partial<Record<string, string>> = {
    home: "/dashboard",
    business: "/dashboard/business",
    marketplace: "/dashboard/marketplace",
    finance: "/dashboard/finance",
    network: "/dashboard/network",
    feed: "/dashboard/pulse",
    connect: "/dashboard/connect",
    wallet: "/dashboard/finance/wallet",
    nxr: "/dashboard/nxr",
    ai: "/dashboard/ai",
    apps: "/dashboard/apps",
    analytics: "/dashboard/finance/analytics",
    crm: "/dashboard/business/customers",
    inventory: "/dashboard/business/products",
    api: "/dashboard/business/webhooks",
    settings: "/dashboard/business/profile",
    "nexar-hq": "/dashboard/nexar-hq",
  };

  const items: DashboardNavItem[] = ATLAS_ROOT_MODULES.filter(
    (m) => m.status !== "planned" && allowed.has(m.id) && (DASHBOARD_ROUTES[m.id] || m.href),
  ).map((m) => ({
    label: m.label,
    href: (DASHBOARD_ROUTES[m.id] ?? m.href) as string,
    icon: MODULE_ICONS[m.id],
    exact: m.id === "home",
  }));

  return [{ title: "ATLAS", items }];
}
