import "server-only";

import type { DomainEvent } from "@/domains";
import type {
  AtlasCorePort,
  CoreTimelineRecord,
  CoreSearchHit,
} from "@/domains/contracts/ports";
import {
  buildHubResult,
  resolveChannels,
  type HubDispatchRequest,
} from "./notification-hub";
import {
  buildSearchDocumentFromEvent,
  type SearchDocumentDraft,
} from "./search-index";
import {
  insertAnalyticsFact,
  insertNotificationDispatch,
  insertOutbox,
  insertTimelineEvent,
  insertWorkflowRun,
  searchDocuments,
  upsertSearchDocument,
} from "./repository";
import {
  NOTIFICATION_HUB_EVENTS,
  SEARCH_INDEX_EVENTS,
  type CoreTimelineScope,
} from "./types";
import { markStepsCompleted, planWorkflow } from "./workflows";

export async function writeOutboxFromEvent(event: DomainEvent): Promise<void> {
  await insertOutbox({
    eventId: event.id,
    eventName: event.name,
    occurredAt: event.occurredAt,
    actorId: event.actorId,
    businessId: event.businessId,
    correlationId: event.correlationId,
    payload: event.payload,
  });
}

export async function appendTimelineFromEvent(
  event: DomainEvent,
): Promise<void> {
  const scopes: CoreTimelineScope[] = [];
  if (event.businessId) {
    scopes.push("business");
    scopes.push("company");
  }
  const customerId =
    (event.payload.customerId as string | undefined) ??
    (event.payload.customer_id as string | undefined);
  if (customerId) scopes.push("customer");
  if (event.actorId) scopes.push("user");
  if (!scopes.length) scopes.push("platform");

  const title = event.name.replace(/\./g, " · ");
  for (const scope of scopes) {
    await insertTimelineEvent({
      scope,
      businessId: event.businessId,
      userId:
        scope === "customer" && customerId ? customerId : event.actorId,
      eventName: event.name,
      title,
      body: undefined,
      entityType: (event.payload.entityType as string | undefined) ?? undefined,
      entityId: (event.payload.entityId as string | undefined) ??
        (event.payload.productId as string | undefined) ??
        (event.payload.orderId as string | undefined),
      sourceEventId: event.id,
      correlationId: event.correlationId,
      metadata: event.payload,
      occurredAt: event.occurredAt,
    });
  }
}

export async function recordAnalyticsFromEvent(
  event: DomainEvent,
): Promise<void> {
  await insertAnalyticsFact({
    eventName: event.name,
    businessId: event.businessId,
    userId: event.actorId,
    entityType: (event.payload.entityType as string | undefined) ?? undefined,
    entityId: (event.payload.entityId as string | undefined) ??
      (event.payload.orderId as string | undefined) ??
      (event.payload.productId as string | undefined),
    metricKey: "domain_event",
    metricValue: Number(event.payload.amount ?? event.payload.total ?? 1),
    dimensions: event.payload,
    sourceEventId: event.id,
    occurredAt: event.occurredAt,
  });
}

export async function indexSearchFromEvent(event: DomainEvent): Promise<void> {
  const mapping = SEARCH_INDEX_EVENTS[event.name];
  if (!mapping) return;
  const entityId =
    (event.payload.entityId as string | undefined) ??
    (event.payload.productId as string | undefined) ??
    (event.payload.businessId as string | undefined) ??
    (event.payload.postId as string | undefined) ??
    (event.payload.applicationId as string | undefined) ??
    event.businessId;
  if (!entityId) return;
  const draft = buildSearchDocumentFromEvent({
    entityType: mapping.entityType,
    entityId,
    businessId: event.businessId,
    payload: event.payload,
    titleKey: mapping.titleFrom,
  });
  if (draft) await upsertSearchDocument(draft);
}

export async function dispatchNotificationHub(
  request: HubDispatchRequest,
): Promise<ReturnType<typeof buildHubResult>> {
  const channels = resolveChannels(request.channels);
  const delivered: Array<"in_app" | "push" | "email"> = [];

  try {
    const { dispatchNotification } = await import(
      "@/modules/notifications/dispatch"
    );
    if (channels.includes("in_app") || channels.includes("email")) {
      await dispatchNotification({
        event: request.eventName,
        userId: request.userId,
        title: request.title,
        body: request.body,
        metadata: request.metadata,
        email:
          channels.includes("email") && request.emailTo
            ? { to: request.emailTo, subject: request.title }
            : undefined,
      });
      if (channels.includes("in_app")) delivered.push("in_app");
      if (channels.includes("email") && request.emailTo) delivered.push("email");
    }
  } catch {
    /* non-fatal */
  }

  if (channels.includes("push")) {
    try {
      const { queueMobilePush } = await import("@/modules/atlas-mobile/service");
      await queueMobilePush({
        userId: request.userId,
        businessId: request.businessId,
        category: "system",
        title: request.title,
        body: request.body,
        payload: request.metadata,
      });
      delivered.push("push");
    } catch {
      /* non-fatal — device may not exist */
    }
  }

  for (const channel of delivered) {
    await insertNotificationDispatch({
      userId: request.userId,
      channel,
      eventName: request.eventName,
      title: request.title,
      body: request.body,
      payload: request.metadata,
      sourceEventId: request.sourceEventId,
      status: "queued",
    });
  }

  return buildHubResult(channels, delivered);
}

export async function fanOutNotificationFromEvent(
  event: DomainEvent,
): Promise<void> {
  const spec = NOTIFICATION_HUB_EVENTS[event.name];
  if (!spec) return;
  const userId =
    (event.payload.userId as string | undefined) ??
    (event.payload.customerId as string | undefined) ??
    (event.payload.ownerUserId as string | undefined) ??
    event.actorId;
  if (!userId) return;

  await dispatchNotificationHub({
    userId,
    eventName: event.name,
    title: spec.title,
    body: (event.payload.body as string | undefined) ?? spec.body,
    channels: spec.channels,
    businessId: event.businessId ?? undefined,
    metadata: event.payload,
    emailTo: event.payload.email as string | undefined,
    sourceEventId: event.id,
  });
}

export async function runCoreOrchestration(
  event: DomainEvent,
): Promise<{ workflowKey: string | null; steps: number }> {
  const planned = planWorkflow(event.name);
  if (!planned) return { workflowKey: null, steps: 0 };

  // Peer modules already handle domain actions via their own subscribers.
  // Core records the orchestration plan as completed (integration spine).
  const steps = markStepsCompleted(planned.steps);
  await insertWorkflowRun({
    workflowKey: planned.workflow.key,
    triggerEvent: event.name,
    sourceEventId: event.id,
    businessId: event.businessId,
    status: "completed",
    steps,
  });
  return { workflowKey: planned.workflow.key, steps: steps.length };
}

/** Central integration handler for every domain event. */
export async function handleCoreDomainEvent(event: DomainEvent): Promise<void> {
  await writeOutboxFromEvent(event);
  await appendTimelineFromEvent(event);
  await recordAnalyticsFromEvent(event);
  await indexSearchFromEvent(event);
  await fanOutNotificationFromEvent(event);
  await runCoreOrchestration(event);
}

export async function unifiedSearch(
  query: string,
  limit = 20,
): Promise<CoreSearchHit[]> {
  const rows = await searchDocuments(query, limit);
  return (rows as Array<Record<string, unknown>>).map((r) => ({
    entityType: String(r.entity_type),
    entityId: String(r.entity_id),
    title: String(r.title),
    body: (r.body as string | null) ?? null,
    businessId: (r.business_id as string | null) ?? null,
  }));
}

export function createAtlasCorePort(): AtlasCorePort {
  return {
    async handleEvent(event) {
      await handleCoreDomainEvent(event as DomainEvent);
    },
    async search(query, limit) {
      return unifiedSearch(query, limit);
    },
    async notify(input) {
      return dispatchNotificationHub(input);
    },
    async indexDocument(draft: SearchDocumentDraft) {
      await upsertSearchDocument(draft);
    },
  };
}

export function createNotificationsPortAdapter() {
  return {
    async notifyUser(userId: string, title: string, body: string) {
      await dispatchNotificationHub({
        userId,
        eventName: "notification.queued",
        title,
        body,
        channels: ["in_app"],
      });
    },
  };
}

export type { CoreTimelineRecord };
export {
  planWorkflow,
  listOrchestratedTriggers,
  connectedModuleCount,
} from "./workflows";
export { CORE_WORKFLOWS, CORE_CONNECTED_MODULES, NOTIFICATION_HUB_EVENTS } from "./types";
