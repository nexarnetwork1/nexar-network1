/**
 * ATLAS Mobile — push notification contracts (pure).
 */

import type { MobilePushCategory } from "./types";

export type PushPayloadContract = {
  category: MobilePushCategory;
  title: string;
  body?: string;
  deepLink?: string;
  data?: Record<string, unknown>;
  priority?: "default" | "high";
  ttlSeconds?: number;
};

export const PUSH_CATEGORY_DEFAULTS: Record<
  MobilePushCategory,
  { priority: "default" | "high"; ttlSeconds: number }
> = {
  business_alert: { priority: "high", ttlSeconds: 86_400 },
  marketplace_order: { priority: "high", ttlSeconds: 86_400 },
  message: { priority: "high", ttlSeconds: 86_400 },
  mention: { priority: "high", ttlSeconds: 86_400 },
  payment: { priority: "high", ttlSeconds: 86_400 },
  invoice: { priority: "default", ttlSeconds: 172_800 },
  ai_insight: { priority: "default", ttlSeconds: 86_400 },
  approval: { priority: "high", ttlSeconds: 86_400 },
  meeting: { priority: "high", ttlSeconds: 3_600 },
  job: { priority: "default", ttlSeconds: 86_400 },
  announcement: { priority: "default", ttlSeconds: 172_800 },
  system: { priority: "default", ttlSeconds: 86_400 },
};

export function buildPushPayload(
  input: PushPayloadContract,
): PushPayloadContract & {
  priority: "default" | "high";
  ttlSeconds: number;
} {
  const defaults = PUSH_CATEGORY_DEFAULTS[input.category];
  return {
    ...input,
    priority: input.priority ?? defaults.priority,
    ttlSeconds: input.ttlSeconds ?? defaults.ttlSeconds,
  };
}

/** Map domain event names → push category (when fan-out is enabled). */
export function pushCategoryForEvent(
  eventName: string,
): MobilePushCategory | null {
  const map: Record<string, MobilePushCategory> = {
    "order.paid": "marketplace_order",
    "payment.confirmed": "payment",
    "invoice.issued": "invoice",
    "invoice.paid": "invoice",
    "connect.message_sent": "message",
    "ai.insight_generated": "ai_insight",
    "connect.meeting_scheduled": "meeting",
    "notification.queued": "system",
  };
  return map[eventName] ?? null;
}
