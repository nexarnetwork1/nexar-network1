/**
 * In-process domain event bus (monolith-first).
 * Swap the publisher implementation later for a queue without changing emitters.
 * Optional outbox writer dual-writes for durable delivery preparation.
 */

import type { DomainEvent, DomainEventName } from "./catalog";

export type DomainEventHandler = (event: DomainEvent) => Promise<void> | void;

const handlers = new Map<DomainEventName | "*", Set<DomainEventHandler>>();

type OutboxWriter = (event: DomainEvent) => Promise<void>;
let outboxWriter: OutboxWriter | null = null;

/** Register durable outbox dual-write (ATLAS Core). */
export function registerOutboxWriter(writer: OutboxWriter): void {
  outboxWriter = writer;
}

export function onDomainEvent(
  name: DomainEventName | "*",
  handler: DomainEventHandler,
): () => void {
  const set = handlers.get(name) ?? new Set();
  set.add(handler);
  handlers.set(name, set);
  return () => set.delete(handler);
}

export async function publishDomainEvent(event: DomainEvent): Promise<void> {
  if (outboxWriter) {
    try {
      await outboxWriter(event);
    } catch {
      /* outbox failure must not block in-process handlers */
    }
  }

  const specific = handlers.get(event.name);
  const wildcard = handlers.get("*");
  const list = [...(specific ?? []), ...(wildcard ?? [])];
  for (const handler of list) {
    await handler(event);
  }
}
