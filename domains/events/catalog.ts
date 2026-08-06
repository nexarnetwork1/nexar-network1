/**
 * Domain event catalog — analytics/notifications must derive from these.
 * In-process outbox first; transport can become a queue later without renaming events.
 */

export const DOMAIN_EVENTS = [
  // Auth
  "user.registered",
  "user.email_verified",
  "user.logged_in",
  "user.logged_out",
  "user.wallet_linked",

  // Business Hub
  "business.created",
  "business.updated",
  "business.verification_submitted",
  "business.verification_approved",
  "business.verification_rejected",
  "business.member_added",
  "business.member_removed",
  "store.created",
  "store.activated",
  "store.suspended",

  // Catalog / Marketplace
  "product.created",
  "product.updated",
  "product.published",
  "product.unpublished",
  "cart.updated",
  "order.placed",
  "order.paid",
  "order.fulfilled",
  "order.cancelled",
  "order.refunded",
  "review.created",

  // Payments / Wallet
  "payment.initiated",
  "payment.confirmed",
  "payment.failed",
  "invoice.issued",
  "invoice.paid",
  "settlement.completed",
  "wallet.credited",
  "wallet.debited",
  "withdrawal.requested",
  "withdrawal.completed",

  // Network / People (planned)
  "partner.invited",
  "partner.accepted",
  "employee.hired",
  "document.uploaded",
  "job.published",

  // ATLAS Network
  "network.profile_created",
  "network.company_profile_created",
  "network.follow_created",
  "network.connection_requested",
  "network.connection_accepted",
  "network.post_created",
  "network.post_updated",
  "network.comment_created",
  "network.reaction_created",
  "network.share_created",
  "network.message_sent",
  "network.activity_recorded",
  "network.community_created",
  "network.page_created",

  // ATLAS Pulse
  "pulse.feed_item_created",
  "pulse.feed_item_updated",
  "pulse.activity_recorded",
  "pulse.trending_updated",
  "pulse.recommendations_updated",
  "pulse.article_published",
  "pulse.insight_generated",
  "pulse.sponsored_created",

  // ATLAS Connect
  "connect.workspace_created",
  "connect.channel_created",
  "connect.conversation_created",
  "connect.message_sent",
  "connect.task_created",
  "connect.meeting_scheduled",
  "connect.meeting_started",
  "connect.meeting_ended",
  "connect.invoice_shared",
  "connect.order_shared",
  "connect.payment_requested",
  "connect.payment_completed",

  // ATLAS Marketplace
  "marketplace.storefront_created",
  "marketplace.listing_published",
  "marketplace.offer_created",
  "marketplace.collection_created",
  "marketplace.checkout_started",
  "marketplace.checkout_completed",
  "marketplace.shipment_created",
  "marketplace.shipment_updated",
  "marketplace.favorite_added",
  "marketplace.advertisement_created",
  "marketplace.review_added",
  "marketplace.refund_requested",
  "marketplace.business_followed",

  // ATLAS AI
  "ai.workspace_created",
  "ai.agent_created",
  "ai.conversation_created",
  "ai.insight_generated",
  "ai.workflow_executed",
  "ai.task_created",
  "ai.prediction_generated",
  "ai.report_generated",
  "ai.recommendation_created",
  "ai.automation_executed",

  // ATLAS Apps
  "apps.application_installed",
  "apps.application_updated",
  "apps.application_removed",
  "apps.application_enabled",
  "apps.application_disabled",

  // ATLAS Finance
  "finance.workspace_created",
  "finance.invoice_created",
  "finance.invoice_paid",
  "finance.expense_created",
  "finance.budget_exceeded",
  "finance.transaction_completed",
  "finance.subscription_renewed",
  "finance.refund_processed",
  "finance.tax_calculated",

  // ATLAS Mobile
  "mobile.device_registered",
  "mobile.device_revoked",
  "mobile.push_queued",
  "mobile.push_delivered",
  "mobile.offline_mutation_queued",
  "mobile.sync_completed",
  "mobile.sync_conflict",
  "mobile.session_started",
  "mobile.remote_command_issued",

  // NXR Token Ecosystem
  "nxr.wallet_created",
  "nxr.wallet_funded",
  "nxr.token_transferred",
  "nxr.reward_granted",
  "nxr.subscription_paid",
  "nxr.marketplace_purchase_paid",
  "nxr.business_verified",
  "nxr.premium_activated",

  // Platform
  "notification.queued",
  "audit.recorded",

  // NEXAR HQ
  "hq.bootstrapped",
  "hq.owner_login",
  "hq.team_member_added",
  "hq.team_member_updated",
  "hq.announcement_updated",
  "hq.website_page_updated",
] as const;

export type DomainEventName = (typeof DOMAIN_EVENTS)[number];

export type DomainEvent<TPayload = Record<string, unknown>> = {
  id: string;
  name: DomainEventName;
  occurredAt: Date;
  actorId: string | null;
  businessId: string | null;
  payload: TPayload;
  /** Monotonic correlation for traces across modules. */
  correlationId: string;
};
