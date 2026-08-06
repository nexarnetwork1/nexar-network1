/**
 * ATLAS Apps — domain types.
 * Business Applications Platform — expandable BOS, not a fixed ERP.
 * Prefixed App* aggregates — jobs context retains Application (job applications).
 */

export type AppCategorySlug =
  | "crm"
  | "hr"
  | "finance"
  | "accounting"
  | "inventory"
  | "pos"
  | "restaurant"
  | "clinic"
  | "hospital"
  | "hotel"
  | "manufacturing"
  | "booking"
  | "education"
  | "construction"
  | "real_estate"
  | "shipping"
  | "logistics"
  | "marketing"
  | "support"
  | "analytics"
  | "ai"
  | "developer_tools"
  | "other";

export type AppPricingModel =
  | "free"
  | "one_time"
  | "subscription"
  | "freemium"
  | "enterprise";

export type AppStatus =
  | "draft"
  | "in_review"
  | "published"
  | "suspended"
  | "retired";

export type AppInstallStatus =
  | "installing"
  | "enabled"
  | "disabled"
  | "upgrading"
  | "failed"
  | "uninstalled";

export type AppPermissionScope =
  | "business"
  | "products"
  | "orders"
  | "crm"
  | "finance"
  | "employees"
  | "wallet"
  | "documents"
  | "ai"
  | "marketplace"
  | "connect"
  | "pulse"
  | "network"
  | "analytics"
  | "settings";

export type AppLicenseType =
  | "free"
  | "commercial"
  | "subscription"
  | "enterprise"
  | "trial";

export type AppDeveloperStatus =
  | "pending"
  | "verified"
  | "suspended"
  | "rejected";

export type AppApplication = {
  id: string;
  developer_id: string | null;
  category_id: string | null;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  icon_url: string | null;
  status: AppStatus;
  pricing_model: AppPricingModel;
  price: number;
  currency: string;
  is_system: boolean;
  is_featured: boolean;
  is_verified: boolean;
  install_count: number;
  rating_avg: number;
  rating_count: number;
  latest_version: string | null;
  homepage_url: string | null;
  support_url: string | null;
  privacy_url: string | null;
  metadata: Record<string, unknown>;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type AppInstall = {
  id: string;
  application_id: string;
  business_id: string;
  installed_by: string | null;
  status: AppInstallStatus;
  installed_version: string | null;
  previous_version: string | null;
  enabled_at: string | null;
  disabled_at: string | null;
  uninstalled_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AppCategory = {
  id: string;
  slug: AppCategorySlug;
  name: string;
  description: string | null;
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AppDeveloper = {
  id: string;
  user_id: string | null;
  business_id: string | null;
  display_name: string;
  slug: string;
  website_url: string | null;
  status: AppDeveloperStatus;
  verified_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AppVersion = {
  id: string;
  application_id: string;
  version: string;
  changelog: string | null;
  manifest: Record<string, unknown>;
  min_platform_version: string | null;
  is_latest: boolean;
  published_at: string | null;
  created_at: string;
};

export type AppPermissionDef = {
  id: string;
  application_id: string;
  scope: AppPermissionScope;
  access_level: string;
  reason: string | null;
  is_required: boolean;
};

export type AppReview = {
  id: string;
  application_id: string;
  business_id: string | null;
  user_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type AppSubscription = {
  id: string;
  install_id: string;
  business_id: string;
  application_id: string;
  plan: string;
  status: string;
  amount: number;
  currency: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export const SYSTEM_APP_SLUGS = [
  "atlas-crm",
  "atlas-hr",
  "atlas-finance",
  "atlas-accounting",
  "atlas-inventory",
  "atlas-pos",
  "atlas-marketing",
  "atlas-support",
  "atlas-analytics-plus",
  "atlas-ai-pack",
] as const;

export const APPS_EVENT_HANDLERS: Record<
  string,
  { action: "recommend" | "notify" | "audit"; description: string }
> = {
  "business.created": {
    action: "recommend",
    description: "Recommend starter apps for new business",
  },
  "product.published": {
    action: "recommend",
    description: "Suggest inventory/POS apps",
  },
  "order.paid": {
    action: "recommend",
    description: "Suggest CRM/support apps",
  },
};

export type InstallAppInput = {
  applicationId: string;
  businessId: string;
  installedBy: string;
  version?: string;
  grantedScopes?: Array<{ scope: AppPermissionScope; accessLevel: string }>;
};

export type DiscoverAppsQuery = {
  query?: string;
  categorySlug?: AppCategorySlug;
  featuredOnly?: boolean;
  verifiedOnly?: boolean;
  limit?: number;
};
