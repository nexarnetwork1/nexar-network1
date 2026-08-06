/**
 * ATLAS Core — integration types.
 * One Platform / One Brain. Does not own Business/Product/Order masters.
 */

export type CoreTimelineScope =
  | "business"
  | "customer"
  | "company"
  | "platform"
  | "user";

export type CoreOutboxStatus =
  | "pending"
  | "processing"
  | "published"
  | "failed"
  | "dead";

export type CoreWorkflowStep = {
  module: string;
  action: string;
  status: "planned" | "completed" | "skipped" | "failed";
  detail?: string;
};

/** Declares cross-module orchestration — peers still own their aggregates. */
export type CoreWorkflowDefinition = {
  key: string;
  trigger: string;
  description: string;
  steps: Array<{ module: string; action: string }>;
};

export const CORE_WORKFLOWS: CoreWorkflowDefinition[] = [
  {
    key: "product_published",
    trigger: "product.published",
    description:
      "Product → Marketplace listing · Pulse · Search · AI · Analytics · Timeline · Notifications",
    steps: [
      { module: "marketplace", action: "ensure_listing" },
      { module: "pulse", action: "ingest_feed_item" },
      { module: "search", action: "index_product" },
      { module: "ai", action: "generate_description_hint" },
      { module: "analytics", action: "record_fact" },
      { module: "timeline", action: "append_business_event" },
      { module: "notifications", action: "notify_followers_optional" },
    ],
  },
  {
    key: "order_paid",
    trigger: "order.paid",
    description:
      "Order → Invoice signal · Finance · CRM hint · Analytics · Wallet · NXR rewards · Timeline · Notifications",
    steps: [
      { module: "finance", action: "post_payment_journal" },
      { module: "marketplace", action: "record_commission" },
      { module: "crm", action: "touch_customer" },
      { module: "analytics", action: "record_sale" },
      { module: "nxr", action: "grant_cashback" },
      { module: "pulse", action: "ingest_sale" },
      { module: "connect", action: "notify_sale" },
      { module: "mobile", action: "push_order" },
      { module: "timeline", action: "append_customer_and_business" },
      { module: "notifications", action: "notify_parties" },
    ],
  },
  {
    key: "post_published",
    trigger: "network.post_created",
    description: "Post → Pulse · Search · Analytics · Timeline · AI summary hint",
    steps: [
      { module: "pulse", action: "ingest_post" },
      { module: "search", action: "index_post" },
      { module: "analytics", action: "record_engagement" },
      { module: "ai", action: "summary_hint" },
      { module: "timeline", action: "append_company_event" },
    ],
  },
  {
    key: "business_verified",
    trigger: "business.verification_approved",
    description: "Verification → Badge · Network · NXR · Premium · Timeline · Notifications",
    steps: [
      { module: "network", action: "mark_verified" },
      { module: "nxr", action: "grant_verification_reward" },
      { module: "apps", action: "unlock_premium_hint" },
      { module: "timeline", action: "append_business_event" },
      { module: "notifications", action: "notify_owner" },
      { module: "search", action: "boost_business" },
    ],
  },
  {
    key: "business_created",
    trigger: "business.created",
    description:
      "Business → Network · Pulse · Connect · AI · Marketplace · Finance · NXR · Apps recommend",
    steps: [
      { module: "network", action: "ensure_company_profile" },
      { module: "pulse", action: "ensure_feed" },
      { module: "connect", action: "ensure_workspace" },
      { module: "ai", action: "ensure_workspace" },
      { module: "marketplace", action: "ensure_storefront" },
      { module: "finance", action: "ensure_workspace" },
      { module: "nxr", action: "ensure_account" },
      { module: "apps", action: "recommend_starters" },
      { module: "timeline", action: "append_platform_event" },
      { module: "search", action: "index_business" },
      { module: "analytics", action: "record_fact" },
    ],
  },
  {
    key: "subscription_paid",
    trigger: "nxr.subscription_paid",
    description: "Subscription → Permissions hint · Finance · Dashboard · Timeline",
    steps: [
      { module: "finance", action: "record_subscription" },
      { module: "apps", action: "unlock_modules_hint" },
      { module: "timeline", action: "append_business_event" },
      { module: "analytics", action: "record_fact" },
      { module: "notifications", action: "notify_owner" },
    ],
  },
];

export function workflowForEvent(
  eventName: string,
): CoreWorkflowDefinition | undefined {
  return CORE_WORKFLOWS.find((w) => w.trigger === eventName);
}

/** Events that should fan out via notification hub when userId is present. */
export const NOTIFICATION_HUB_EVENTS: Record<
  string,
  { title: string; body: string; channels: Array<"in_app" | "push" | "email"> }
> = {
  "order.paid": {
    title: "Order paid",
    body: "A payment was confirmed.",
    channels: ["in_app", "push", "email"],
  },
  "payment.confirmed": {
    title: "Payment confirmed",
    body: "Your payment was successful.",
    channels: ["in_app", "push", "email"],
  },
  "invoice.issued": {
    title: "Invoice issued",
    body: "A new invoice is ready.",
    channels: ["in_app", "email"],
  },
  "business.verification_approved": {
    title: "Business verified",
    body: "Your business is now verified.",
    channels: ["in_app", "push", "email"],
  },
  "product.published": {
    title: "Product published",
    body: "Your product is live.",
    channels: ["in_app"],
  },
  "nxr.reward_granted": {
    title: "NXR reward",
    body: "You received NXR rewards.",
    channels: ["in_app", "push"],
  },
};

export const SEARCH_INDEX_EVENTS: Record<
  string,
  { entityType: string; titleFrom: string }
> = {
  "product.published": { entityType: "product", titleFrom: "title" },
  "product.created": { entityType: "product", titleFrom: "name" },
  "business.created": { entityType: "business", titleFrom: "displayName" },
  "network.post_created": { entityType: "post", titleFrom: "title" },
  "apps.application_installed": { entityType: "app", titleFrom: "slug" },
};

/** Modules atlas-core integrates — peers remain owners of their data. */
export const CORE_CONNECTED_MODULES = [
  "business",
  "marketplace",
  "network",
  "pulse",
  "connect",
  "finance",
  "crm",
  "ai",
  "apps",
  "analytics",
  "wallet",
  "notifications",
  "search",
  "mobile",
  "nxr",
] as const;
