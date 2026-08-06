/**
 * ATLAS Pulse — domain types.
 * Business Intelligence Feed — not social media.
 */

export type PulseFeedScope = "platform" | "business" | "user" | "industry" | "following";

export type PulseItemType =
  | "text"
  | "image"
  | "video"
  | "pdf"
  | "article"
  | "product"
  | "service"
  | "marketplace_listing"
  | "job"
  | "investment"
  | "announcement"
  | "event"
  | "poll"
  | "business_update"
  | "ai_insight"
  | "milestone"
  | "promotion"
  | "partnership"
  | "employee"
  | "verification"
  | "marketplace_sale"
  | "review";

export type PulseItemSource =
  | "business_hub"
  | "atlas_network"
  | "marketplace"
  | "catalog"
  | "orders"
  | "payments"
  | "ai"
  | "atlas_pulse"
  | "admin"
  | "external";

export type PulseReactionType =
  | "like"
  | "celebrate"
  | "support"
  | "insightful"
  | "interesting"
  | "love";

export type PulseArticleCategory =
  | "technology"
  | "ai"
  | "marketing"
  | "finance"
  | "logistics"
  | "leadership"
  | "sales"
  | "startups"
  | "business_strategy"
  | "general";

export type PulseFeed = {
  id: string;
  scope: PulseFeedScope;
  owner_id: string | null;
  business_id: string | null;
  title: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type PulseTimeline = {
  id: string;
  business_id: string;
  feed_id: string;
  item_count: number;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PulseFeedItem = {
  id: string;
  feed_id: string;
  business_id: string | null;
  actor_user_id: string | null;
  item_type: PulseItemType;
  source: PulseItemSource;
  source_event: string | null;
  source_entity_type: string | null;
  source_entity_id: string | null;
  title: string | null;
  summary: string | null;
  body: string | null;
  payload: Record<string, unknown>;
  visibility: string;
  trending_score: number;
  engagement_score: number;
  view_count: number;
  reaction_count: number;
  comment_count: number;
  share_count: number;
  bookmark_count: number;
  is_sponsored: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type PulseActivity = {
  id: string;
  business_id: string | null;
  actor_user_id: string | null;
  activity_type: string;
  source: PulseItemSource;
  source_event: string | null;
  payload: Record<string, unknown>;
  feed_item_id: string | null;
  created_at: string;
};

export type PulseRecommendation = {
  id: string;
  target_user_id: string | null;
  target_business_id: string | null;
  recommended_entity_type: string;
  recommended_entity_id: string;
  score: number;
  reason: string | null;
  metadata: Record<string, unknown>;
  expires_at: string | null;
  created_at: string;
};

export type PulseTrendingBusiness = {
  id: string;
  business_id: string;
  score: number;
  rank: number | null;
  industry: string | null;
  metadata: Record<string, unknown>;
  window_start: string;
  updated_at: string;
};

export type IngestPulseEventInput = {
  sourceEvent: string;
  source: PulseItemSource;
  businessId?: string | null;
  actorUserId?: string | null;
  itemType: PulseItemType;
  title: string;
  summary?: string;
  payload?: Record<string, unknown>;
  sourceEntityType?: string;
  sourceEntityId?: string;
};

/** Maps platform domain events → Pulse feed item types. */
export const PULSE_EVENT_MAP: Record<
  string,
  { itemType: PulseItemType; source: PulseItemSource; title: (p: Record<string, unknown>) => string }
> = {
  "business.verification_approved": {
    itemType: "verification",
    source: "business_hub",
    title: () => "Business verified",
  },
  "store.created": {
    itemType: "milestone",
    source: "business_hub",
    title: () => "New store opened",
  },
  "store.activated": {
    itemType: "announcement",
    source: "business_hub",
    title: () => "Store activated",
  },
  "product.created": {
    itemType: "product",
    source: "catalog",
    title: (p) => `New product: ${String(p.name ?? "Product")}`,
  },
  "product.published": {
    itemType: "product",
    source: "catalog",
    title: (p) => `Product launched: ${String(p.name ?? "Product")}`,
  },
  "order.paid": {
    itemType: "marketplace_sale",
    source: "marketplace",
    title: () => "Marketplace sale completed",
  },
  "order.placed": {
    itemType: "marketplace_sale",
    source: "marketplace",
    title: () => "New marketplace order",
  },
  "marketplace.listing_published": {
    itemType: "marketplace_listing",
    source: "marketplace",
    title: (p) => `Listing published: ${String(p.title ?? "Listing")}`,
  },
  "marketplace.storefront_created": {
    itemType: "business_update",
    source: "marketplace",
    title: () => "Marketplace storefront opened",
  },
  "marketplace.shipment_created": {
    itemType: "marketplace_sale",
    source: "marketplace",
    title: () => "Shipment created",
  },
  "review.created": {
    itemType: "review",
    source: "marketplace",
    title: () => "New marketplace review",
  },
  "network.post_created": {
    itemType: "text",
    source: "atlas_network",
    title: () => "Network update",
  },
  "network.company_profile_created": {
    itemType: "business_update",
    source: "atlas_network",
    title: () => "Company page live",
  },
  "employee.hired": {
    itemType: "employee",
    source: "business_hub",
    title: () => "New team member joined",
  },
  "partner.accepted": {
    itemType: "partnership",
    source: "business_hub",
    title: () => "New partnership formed",
  },
  "job.published": {
    itemType: "job",
    source: "business_hub",
    title: (p) => `Now hiring: ${String(p.title ?? "Role")}`,
  },
};
