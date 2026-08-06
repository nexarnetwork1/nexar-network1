/**
 * ATLAS Mobile — domain types.
 * Complete mobile experience of ATLAS — not a companion app.
 * Prefixed Mobile* aggregates. Never owns Business/Product/Order masters.
 */

export type MobilePlatform =
  | "ios"
  | "android"
  | "tablet_ios"
  | "tablet_android"
  | "foldable"
  | "desktop_companion"
  | "wearable"
  | "web_pwa"
  | "other";

export type MobileDeviceStatus = "active" | "revoked" | "lost" | "suspended";

export type MobileAuthMethod =
  | "password"
  | "pin"
  | "face_id"
  | "touch_id"
  | "mfa"
  | "passkey"
  | "other";

export type MobilePushCategory =
  | "business_alert"
  | "marketplace_order"
  | "message"
  | "mention"
  | "payment"
  | "invoice"
  | "ai_insight"
  | "approval"
  | "meeting"
  | "job"
  | "announcement"
  | "system";

export type MobileOfflineStatus =
  | "pending"
  | "syncing"
  | "synced"
  | "conflict"
  | "failed"
  | "discarded";

export type MobileConflictStrategy =
  | "server_wins"
  | "client_wins"
  | "last_write_wins"
  | "manual_merge";

export type MobileSyncScope =
  | "business"
  | "orders"
  | "inventory"
  | "crm"
  | "connect"
  | "wallet"
  | "finance"
  | "marketplace"
  | "network"
  | "pulse"
  | "ai"
  | "settings"
  | "all";

export type MobileCameraJobType =
  | "document"
  | "invoice"
  | "receipt"
  | "qr"
  | "barcode"
  | "business_card"
  | "ocr"
  | "product";

export type MobileDevice = {
  id: string;
  user_id: string;
  business_id: string | null;
  device_fingerprint: string;
  platform: MobilePlatform;
  os_version: string | null;
  app_version: string | null;
  model: string | null;
  push_enabled: boolean;
  biometrics_enabled: boolean;
  pin_enabled: boolean;
  status: MobileDeviceStatus;
  last_seen_at: string | null;
  trusted_at: string | null;
  revoked_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type MobileOfflineQueueItem = {
  id: string;
  device_id: string;
  user_id: string;
  business_id: string | null;
  client_mutation_id: string;
  scope: MobileSyncScope;
  entity_type: string;
  entity_id: string | null;
  operation: "create" | "update" | "delete" | "upsert";
  payload: Record<string, unknown>;
  base_version: number | null;
  status: MobileOfflineStatus;
  conflict_strategy: MobileConflictStrategy;
  attempts: number;
  last_error: string | null;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MobileSyncCursor = {
  id: string;
  device_id: string;
  user_id: string;
  business_id: string | null;
  scope: MobileSyncScope;
  cursor_token: string;
  last_synced_at: string | null;
  metadata: Record<string, unknown>;
  updated_at: string;
};

export type MobilePushDelivery = {
  id: string;
  user_id: string;
  device_id: string | null;
  business_id: string | null;
  category: MobilePushCategory;
  title: string;
  body: string | null;
  payload: Record<string, unknown>;
  deep_link: string | null;
  status: string;
  created_at: string;
};

/** Capability apps projected on mobile — same business, same data. */
export const MOBILE_APPLICATIONS = [
  "business",
  "marketplace",
  "network",
  "pulse",
  "connect",
  "wallet",
  "ai",
  "finance",
  "crm",
] as const;

export const MOBILE_DASHBOARD_WIDGETS = [
  "business_overview",
  "revenue",
  "orders",
  "notifications",
  "tasks",
  "meetings",
  "ai_insights",
  "quick_actions",
] as const;

/** Masters Mobile consumes — never owns. */
export const MOBILE_CONSUMES = [
  "User",
  "Business",
  "Product",
  "Order",
  "Invoice",
  "Wallet",
  "ConnectConversation",
  "PulseFeedItem",
] as const;

export const MOBILE_EVENT_HANDLERS: Record<
  string,
  { action: "push" | "sync" | "audit"; description: string }
> = {
  "order.paid": {
    action: "push",
    description: "Push marketplace order alert",
  },
  "payment.confirmed": {
    action: "push",
    description: "Push payment confirmation",
  },
  "invoice.issued": {
    action: "push",
    description: "Push invoice issued",
  },
  "connect.message_sent": {
    action: "push",
    description: "Push message notification",
  },
  "ai.insight_generated": {
    action: "push",
    description: "Push AI insight",
  },
  "notification.queued": {
    action: "push",
    description: "Fan-out platform notification to devices",
  },
};

export type RegisterDeviceInput = {
  userId: string;
  deviceFingerprint: string;
  platform: MobilePlatform;
  businessId?: string;
  osVersion?: string;
  appVersion?: string;
  model?: string;
  biometricsEnabled?: boolean;
  pinEnabled?: boolean;
};

export type EnqueueOfflineMutationInput = {
  deviceId: string;
  userId: string;
  businessId?: string;
  clientMutationId: string;
  scope: MobileSyncScope;
  entityType: string;
  entityId?: string;
  operation: "create" | "update" | "delete" | "upsert";
  payload: Record<string, unknown>;
  baseVersion?: number;
  conflictStrategy?: MobileConflictStrategy;
};

export type QueuePushInput = {
  userId: string;
  deviceId?: string;
  businessId?: string;
  category: MobilePushCategory;
  title: string;
  body?: string;
  payload?: Record<string, unknown>;
  deepLink?: string;
};
