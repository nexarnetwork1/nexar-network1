/**
 * ATLAS — platform identity layer (Phase 1).
 *
 * ATLAS is the Business Operating System. Bounded contexts (e.g. businessHub,
 * marketplace) are capabilities inside ATLAS — not separate products.
 *
 * Backward compatibility: internal keys (`businessHub`, `business_hub` DB id)
 * and `modules/business-hub/` paths are unchanged.
 */

import type { BoundedContextId } from "./map";

export const ATLAS_PLATFORM = {
  id: "atlas",
  name: "ATLAS",
  byline: "by NEXAR NETWORK",
  tagline: "Business Operating System",
  network: "NEXAR NETWORK",
} as const;

/**
 * Maps ATLAS root modules to bounded contexts.
 * `business` module wraps the legacy Business Hub capability.
 */
export const ATLAS_MODULE_CONTEXTS: Record<string, BoundedContextId | undefined> = {
  home: undefined,
  business: "businessHub",
  marketplace: "marketplace",
  network: "atlasNetwork",
  feed: "atlasPulse",
  connect: "atlasConnect",
  /** @deprecated Prefer `connect` — social DMs remain Network-owned legacy foundation. */
  chat: "atlasConnect",
  wallet: "wallet",
  ai: "atlasAi",
  apps: "atlasApps",
  analytics: "analytics",
  documents: "documents",
  /** Operational CRM surfaces are delivered as installable Apps. */
  crm: "atlasApps",
  hr: "employees",
  /** Finance OS — GL/tax/budgets; payment rails remain under payments. */
  finance: "atlasFinance",
  inventory: "catalog",
  mobile: "atlasMobile",
  nxr: "nxrToken",
  core: "atlasCore",
  api: "api",
  settings: "settings",
  /** NEXAR HQ — internal only; never exposed to customers. */
  "nexar-hq": "atlasHq",
};

/** ATLAS Network — second core pillar. */
export const ATLAS_NETWORK_MODULE = {
  id: "network",
  publicName: "Network",
  internalContext: "atlasNetwork" as BoundedContextId,
  internalModulePath: "modules/atlas-network",
  dbNamespace: "atlas_network",
  consumes: ["Business", "Product", "Store"] as const,
  owns: ["Profile", "Post", "Connection", "Follow", "Page", "Conversation"] as const,
} as const;

/** ATLAS Pulse — Business Intelligence Feed (third pillar). */
export const ATLAS_PULSE_MODULE = {
  id: "feed",
  publicName: "Pulse",
  internalContext: "atlasPulse" as BoundedContextId,
  internalModulePath: "modules/atlas-pulse",
  dbNamespace: "atlas_pulse",
  consumes: ["Business", "Product", "Store", "Post", "Order"] as const,
  owns: ["PulseFeedItem", "PulseTimeline", "TrendingBusiness", "PulseRecommendation"] as const,
} as const;

/** ATLAS Connect — Business Collaboration Platform (fourth pillar). */
export const ATLAS_CONNECT_MODULE = {
  id: "connect",
  publicName: "Connect",
  internalContext: "atlasConnect" as BoundedContextId,
  internalModulePath: "modules/atlas-connect",
  dbNamespace: "atlas_connect",
  consumes: ["Business", "Product", "Order", "Invoice"] as const,
  owns: [
    "ConnectWorkspace",
    "ConnectConversation",
    "ConnectChannel",
    "ConnectMessage",
    "ConnectTask",
    "ConnectMeeting",
  ] as const,
} as const;

/** ATLAS AI — Business Intelligence Engine (fifth pillar). */
export const ATLAS_AI_MODULE = {
  id: "ai",
  publicName: "AI",
  internalContext: "atlasAi" as BoundedContextId,
  internalModulePath: "modules/atlas-ai",
  dbNamespace: "atlas_ai",
  consumes: [
    "Business",
    "Product",
    "Order",
    "Invoice",
    "ConnectWorkspace",
    "PulseFeedItem",
  ] as const,
  owns: [
    "AiWorkspace",
    "AiAgent",
    "AiConversation",
    "AiMemory",
    "AiKnowledgeItem",
    "AiWorkflow",
    "AiInsight",
  ] as const,
} as const;

/**
 * @deprecated Internal name — use ATLAS **Business** module in public docs.
 * The bounded context key `businessHub` remains for code and DB compatibility.
 */
export const LEGACY_BUSINESS_HUB_CONTEXT: BoundedContextId = "businessHub";

/** Public label for the Business capability (formerly "Business Hub"). */
export const ATLAS_BUSINESS_MODULE = {
  id: "business",
  publicName: "Business",
  internalContext: LEGACY_BUSINESS_HUB_CONTEXT,
  internalModulePath: "modules/business-hub",
  dbNamespace: "business_hub",
} as const;

/** Marketplace is a sales channel — never owns business master data. */
export const ATLAS_MARKETPLACE_MODULE = {
  id: "marketplace",
  publicName: "Marketplace",
  role: "sales_channel" as const,
  internalContext: "marketplace" as BoundedContextId,
  internalModulePath: "modules/atlas-marketplace",
  dbNamespace: "atlas_marketplace",
  consumes: ["Store", "Product", "BusinessProfile", "Order", "Brand"] as const,
  owns: [
    "Listing",
    "MarketplaceListing",
    "MarketplaceStorefront",
    "Cart",
    "Wishlist",
    "Discovery",
    "MarketplaceCheckout",
    "MarketplaceShipment",
  ] as const,
} as const;

/** ATLAS Apps — Business Applications Platform (expandable BOS, not a fixed ERP). */
export const ATLAS_APPS_MODULE = {
  id: "apps",
  publicName: "Apps",
  role: "application_platform" as const,
  internalContext: "atlasApps" as BoundedContextId,
  internalModulePath: "modules/atlas-apps",
  dbNamespace: "atlas_apps",
  consumes: [
    "Business",
    "Product",
    "Order",
    "Employee",
    "Wallet",
    "Document",
  ] as const,
  owns: [
    "AppApplication",
    "AppInstall",
    "AppCategory",
    "AppPermission",
    "AppSubscription",
    "AppVersion",
    "AppDeveloper",
    "AppReview",
    "AppLicense",
    "AppWebhook",
    "AppSettings",
  ] as const,
} as const;

/**
 * ATLAS Mobile — complete mobile platform of ATLAS (not a companion app).
 * Same business, data, permissions, AI — offline-first + cloud synced.
 */
export const ATLAS_MOBILE_MODULE = {
  id: "mobile",
  publicName: "Mobile",
  role: "mobile_platform" as const,
  internalContext: "atlasMobile" as BoundedContextId,
  internalModulePath: "modules/atlas-mobile",
  dbNamespace: "atlas_mobile",
  consumes: [
    "User",
    "Business",
    "Product",
    "Order",
    "Invoice",
    "Wallet",
  ] as const,
  owns: [
    "MobileDevice",
    "MobileSession",
    "MobilePushDelivery",
    "MobileOfflineQueueItem",
    "MobileSyncCursor",
    "MobileDeepLink",
    "MobileCameraJob",
    "MobileEntitlement",
  ] as const,
  platforms: [
    "ios",
    "android",
    "tablet",
    "foldable",
    "desktop_companion",
    "wearable_future",
  ] as const,
} as const;

/**
 * ATLAS Finance — Financial Operating System.
 * Owns GL / journals / tax / budgets. Consumes Invoice/Payment/Wallet masters.
 */
export const ATLAS_FINANCE_MODULE = {
  id: "finance",
  publicName: "Finance",
  role: "financial_operating_system" as const,
  internalContext: "atlasFinance" as BoundedContextId,
  internalModulePath: "modules/atlas-finance",
  dbNamespace: "atlas_finance",
  consumes: [
    "Business",
    "Invoice",
    "Payment",
    "Wallet",
    "LedgerEntry",
    "Order",
    "Settlement",
  ] as const,
  owns: [
    "FinanceWorkspace",
    "FinanceChartOfAccounts",
    "FinanceAccount",
    "FinanceJournal",
    "FinanceJournalEntry",
    "FinanceLedger",
    "FinanceTransaction",
    "FinanceExpense",
    "FinanceBudget",
    "FinanceTaxRate",
    "FinancePeriod",
  ] as const,
} as const;

/**
 * NXR Token Ecosystem — native utility token of ATLAS (blockchain-optional).
 * Keeps context key `nxrToken` for compatibility; module at modules/atlas-nxr.
 */
export const ATLAS_NXR_MODULE = {
  id: "nxr",
  publicName: "NXR",
  role: "digital_economy" as const,
  internalContext: "nxrToken" as BoundedContextId,
  internalModulePath: "modules/atlas-nxr",
  dbNamespace: "atlas_nxr",
  blockchainRequired: false as const,
  consumes: [
    "Wallet",
    "LedgerEntry",
    "Business",
    "User",
    "Invoice",
    "Payment",
    "Order",
  ] as const,
  owns: [
    "NxrToken",
    "NxrWallet",
    "NxrTransaction",
    "NxrReward",
    "NxrLoyaltyAccount",
    "NxrTreasury",
    "NxrTokenPayment",
  ] as const,
  chainAdapters: [
    "ethereum",
    "bnb_chain",
    "polygon",
    "solana",
    "nexar_chain",
  ] as const,
} as const;

/**
 * ATLAS Core — One Platform / One Brain.
 * Orchestration spine; does not own Business/Product/Order masters.
 */
export const ATLAS_CORE_MODULE = {
  id: "core",
  publicName: "Core",
  role: "integration_spine" as const,
  internalContext: "atlasCore" as BoundedContextId,
  internalModulePath: "modules/atlas-core",
  dbNamespace: "atlas_core",
  owns: [
    "CoreOutboxMessage",
    "CoreTimelineEvent",
    "CoreSearchDocument",
    "CoreAnalyticsFact",
    "CoreWorkflowRun",
  ] as const,
  integrates: [
    "business",
    "marketplace",
    "network",
    "pulse",
    "connect",
    "finance",
    "ai",
    "apps",
    "mobile",
    "nxr",
    "notifications",
    "search",
    "analytics",
  ] as const,
} as const;

/**
 * NEXAR HQ — sole internal administration capability of ATLAS.
 * Not a separate product. Customers never see this module.
 */
export const ATLAS_HQ_MODULE = {
  id: "nexar-hq",
  publicName: "NEXAR HQ",
  role: "internal_administration" as const,
  internalContext: "atlasHq" as BoundedContextId,
  internalModulePath: "modules/atlas-hq",
  dbNamespace: "atlas_hq",
  legacyAdminRoutes: "app/admin" as const,
  consumes: [
    "Business",
    "User",
    "Order",
    "Payment",
    "Wallet",
    "AuditLog",
  ] as const,
  owns: [
    "HqBootstrap",
    "HqPlatformOwner",
    "HqTeamMember",
    "HqWebsitePage",
    "HqAnnouncement",
  ] as const,
  platformOwnerEmail: "admin@nexarnetwork.org" as const,
} as const;
