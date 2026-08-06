import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { CoreTimelineScope, CoreWorkflowStep } from "./types";
import type { SearchDocumentDraft } from "./search-index";

function db() {
  return createAdminClient();
}

export async function insertOutbox(input: {
  eventId: string;
  eventName: string;
  occurredAt: Date;
  actorId: string | null;
  businessId: string | null;
  correlationId: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  await db().from("atlas_core_outbox").upsert(
    {
      event_id: input.eventId,
      event_name: input.eventName,
      occurred_at: input.occurredAt.toISOString(),
      actor_id: input.actorId,
      business_id: input.businessId,
      correlation_id: input.correlationId,
      payload: input.payload,
      status: "published",
      published_at: new Date().toISOString(),
    },
    { onConflict: "event_id" },
  );
}

export async function listPendingOutbox(limit = 50) {
  const { data } = await db()
    .from("atlas_core_outbox")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);
  return data ?? [];
}

export async function markOutboxStatus(
  eventId: string,
  status: string,
  error?: string,
): Promise<void> {
  await db()
    .from("atlas_core_outbox")
    .update({
      status,
      last_error: error ?? null,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .eq("event_id", eventId);
}

export async function insertTimelineEvent(input: {
  scope: CoreTimelineScope;
  businessId?: string | null;
  userId?: string | null;
  eventName: string;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
  sourceEventId?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
}): Promise<void> {
  await db().from("atlas_core_timeline_events").insert({
    scope: input.scope,
    business_id: input.businessId ?? null,
    user_id: input.userId ?? null,
    event_name: input.eventName,
    title: input.title,
    body: input.body ?? null,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    source_event_id: input.sourceEventId ?? null,
    correlation_id: input.correlationId ?? null,
    metadata: input.metadata ?? {},
    occurred_at: (input.occurredAt ?? new Date()).toISOString(),
  });
}

export async function upsertSearchDocument(
  draft: SearchDocumentDraft,
): Promise<void> {
  await db().from("atlas_core_search_documents").upsert(
    {
      entity_type: draft.entityType,
      entity_id: draft.entityId,
      business_id: draft.businessId ?? null,
      title: draft.title,
      body: draft.body ?? null,
      keywords: draft.keywords ?? [],
      is_published: draft.isPublished ?? true,
      rank_boost: draft.rankBoost ?? 0,
      metadata: draft.metadata ?? {},
      indexed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "entity_type,entity_id" },
  );
}

export async function searchDocuments(query: string, limit = 20) {
  const { data } = await db()
    .from("atlas_core_search_documents")
    .select("*")
    .eq("is_published", true)
    .or(`title.ilike.%${query}%,body.ilike.%${query}%`)
    .limit(limit);
  return data ?? [];
}

export async function insertAnalyticsFact(input: {
  eventName: string;
  businessId?: string | null;
  userId?: string | null;
  entityType?: string;
  entityId?: string;
  metricKey?: string;
  metricValue?: number;
  dimensions?: Record<string, unknown>;
  sourceEventId?: string;
  occurredAt?: Date;
}): Promise<void> {
  await db().from("atlas_core_analytics_facts").insert({
    event_name: input.eventName,
    business_id: input.businessId ?? null,
    user_id: input.userId ?? null,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    metric_key: input.metricKey ?? "event",
    metric_value: input.metricValue ?? 1,
    dimensions: input.dimensions ?? {},
    source_event_id: input.sourceEventId ?? null,
    occurred_at: (input.occurredAt ?? new Date()).toISOString(),
  });
}

export async function insertWorkflowRun(input: {
  workflowKey: string;
  triggerEvent: string;
  sourceEventId?: string;
  businessId?: string | null;
  status: string;
  steps: CoreWorkflowStep[];
  error?: string;
}): Promise<void> {
  await db().from("atlas_core_workflow_runs").insert({
    workflow_key: input.workflowKey,
    trigger_event: input.triggerEvent,
    source_event_id: input.sourceEventId ?? null,
    business_id: input.businessId ?? null,
    status: input.status,
    steps: input.steps,
    error: input.error ?? null,
    finished_at: new Date().toISOString(),
  });
}

export async function insertNotificationDispatch(input: {
  userId: string;
  channel: string;
  eventName: string;
  title: string;
  body?: string;
  payload?: Record<string, unknown>;
  sourceEventId?: string;
  status?: string;
}): Promise<void> {
  await db().from("atlas_core_notification_dispatches").insert({
    user_id: input.userId,
    channel: input.channel,
    event_name: input.eventName,
    title: input.title,
    body: input.body ?? null,
    payload: input.payload ?? {},
    source_event_id: input.sourceEventId ?? null,
    status: input.status ?? "queued",
  });
}
