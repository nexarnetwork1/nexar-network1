/**
 * ATLAS Apps event subscribers — recommendations & audit on business signals.
 */

import { onDomainEvent } from "@/domains/events/bus";
import type { DomainEventName } from "@/domains/events/catalog";
import { APPS_EVENT_HANDLERS } from "./types";

let registered = false;

const APPS_EVENTS = Object.keys(APPS_EVENT_HANDLERS) as Array<
  keyof typeof APPS_EVENT_HANDLERS
>;

export function registerAtlasAppsEventHandlers(): void {
  if (registered) return;
  registered = true;

  for (const eventName of APPS_EVENTS) {
    onDomainEvent(eventName as DomainEventName, async (event) => {
      try {
        const { handleAppsDomainEvent } = await import("./service");
        await handleAppsDomainEvent({
          name: event.name,
          actorId: event.actorId,
          businessId: event.businessId,
          payload: event.payload,
        });
      } catch {
        /* non-fatal */
      }
    });
  }
}
