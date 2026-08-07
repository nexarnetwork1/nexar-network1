/**
 * ATLAS social shell navigation — single source for /atlas/* sidebar, app bar, and mobile nav.
 * Dashboard workspace nav remains in `config/atlas-nav.ts` (`atlasNavSections`).
 */

export type AtlasAppNavIcon =
  | "home"
  | "building2"
  | "store"
  | "briefcase"
  | "calendar"
  | "messageSquare"
  | "bell"
  | "users"
  | "search"
  | "layoutDashboard"
  | "barChart3"
  | "settings"
  | "plus"
  | "user"
  | "grid";

export type AtlasAppNavItem = {
  id: string;
  label: string;
  href: string;
  icon: AtlasAppNavIcon;
  /** Opens auth modal instead of navigating when guest. */
  requiresAuth?: boolean;
  /** Center FAB on mobile bottom nav. */
  mobilePrimary?: boolean;
  /** Shown in mobile overflow sheet instead of bottom bar. */
  mobileMore?: boolean;
  /** Compact icon-only link in AtlasAppBar. */
  appBar?: boolean;
  appBarTitle?: string;
};

/** Primary sidebar + desktop navigation. */
export const ATLAS_APP_NAV_ITEMS: readonly AtlasAppNavItem[] = [
  { id: "feed", label: "Home Feed", href: "/atlas", icon: "home" },
  {
    id: "business",
    label: "My Company",
    href: "/atlas/business",
    icon: "building2",
    requiresAuth: true,
    mobileMore: true,
  },
  { id: "marketplace", label: "Marketplace", href: "/atlas/marketplace", icon: "store", mobileMore: true },
  { id: "jobs", label: "Jobs", href: "/atlas/jobs", icon: "briefcase", mobileMore: true },
  { id: "events", label: "Events", href: "/atlas/events", icon: "calendar", mobileMore: true },
  { id: "messages", label: "Messages", href: "/atlas/messages", icon: "messageSquare" },
  {
    id: "notifications",
    label: "Notifications",
    href: "/atlas/notifications",
    icon: "bell",
    requiresAuth: true,
    mobileMore: true,
    appBar: true,
  },
  { id: "network", label: "Network", href: "/atlas/network", icon: "users", appBar: true, appBarTitle: "Friends" },
  { id: "search", label: "Search", href: "/atlas/search", icon: "search", mobileMore: true },
];

/** Business workspace shortcuts (authenticated sidebar section). */
export const ATLAS_APP_BUSINESS_ITEMS: readonly AtlasAppNavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard/business", icon: "layoutDashboard", mobileMore: true },
  { id: "analytics", label: "Analytics", href: "/dashboard/business/analytics", icon: "barChart3" },
  { id: "settings", label: "Settings", href: "/dashboard/business/profile", icon: "settings" },
];

/** Mobile bottom bar (max 5 slots). */
export const ATLAS_APP_MOBILE_PRIMARY: readonly AtlasAppNavItem[] = [
  { id: "feed", label: "Home", href: "/atlas", icon: "home" },
  { id: "network", label: "Network", href: "/atlas/network", icon: "users" },
  {
    id: "create",
    label: "Create",
    href: "/atlas/create-post",
    icon: "plus",
    requiresAuth: true,
    mobilePrimary: true,
  },
  { id: "messages", label: "Messages", href: "/atlas/messages", icon: "messageSquare" },
  { id: "more", label: "More", href: "#more", icon: "grid" },
];

/** Overflow sheet links on mobile. */
export const ATLAS_APP_MOBILE_MORE: readonly AtlasAppNavItem[] = [
  { id: "marketplace", label: "Marketplace", href: "/atlas/marketplace", icon: "store" },
  { id: "jobs", label: "Jobs", href: "/atlas/jobs", icon: "briefcase" },
  { id: "events", label: "Events", href: "/atlas/events", icon: "calendar" },
  { id: "search", label: "Search", href: "/atlas/search", icon: "search" },
  {
    id: "notifications",
    label: "Notifications",
    href: "/atlas/notifications",
    icon: "bell",
    requiresAuth: true,
  },
  { id: "profile", label: "Profile", href: "/atlas/profile", icon: "user", requiresAuth: true },
  {
    id: "business",
    label: "My Company",
    href: "/atlas/business",
    icon: "building2",
    requiresAuth: true,
  },
  {
    id: "dashboard",
    label: "Business Dashboard",
    href: "/dashboard/business",
    icon: "layoutDashboard",
    requiresAuth: true,
  },
  { id: "modules", label: "All Modules", href: "/atlas/modules", icon: "grid" },
];

/** AtlasAppBar icon shortcuts. */
export const ATLAS_APP_BAR_ITEMS: readonly AtlasAppNavItem[] = ATLAS_APP_NAV_ITEMS.filter(
  (item) => item.appBar,
).concat([
  {
    id: "messages-bar",
    label: "Messages",
    href: "/atlas/messages",
    icon: "messageSquare",
    appBar: true,
  },
  {
    id: "profile-bar",
    label: "Profile",
    href: "/atlas/profile",
    icon: "user",
    requiresAuth: true,
    appBar: true,
  },
]);

/** Maps dashboard module routes to live ATLAS social routes. */
export const ATLAS_DASHBOARD_SOCIAL_REDIRECTS: Record<string, string> = {
  "/dashboard/network": "/atlas/network",
  "/dashboard/pulse": "/atlas",
  "/dashboard/connect": "/atlas/messages",
};

/** Cross-ecosystem quick links reused in messaging, commerce, and empty states. */
export const ATLAS_ECOSYSTEM_LINKS = [
  { label: "Feed", href: "/atlas" },
  { label: "Network", href: "/atlas/network" },
  { label: "Marketplace", href: "/atlas/marketplace" },
  { label: "Jobs", href: "/atlas/jobs" },
  { label: "Events", href: "/atlas/events" },
  { label: "Search", href: "/atlas/search" },
  { label: "Messages", href: "/atlas/messages" },
] as const;
