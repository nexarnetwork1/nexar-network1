/**
 * ATLAS Mobile event subscribers — push fan-out from domain events.
 */

import { onDomainEvent } from "@/domains/events/bus";
import type { DomainEventName } from "@/domains/events/catalog";
import { MOBILE_EVENT_HANDLERS } from "./types";

let registered = false;

const MOBILE_EVENTS = Object.keys(MOBILE_EVENT_HANDLERS) as Array<
  keyof typeof MOBILE_EVENT_HANDLERS
>;

export function registerAtlasMobileEventHandlers(): void {
  if (registered) return;
  registered = true;

  for (const eventName of MOBILE_EVENTS) {
    onDomainEvent(eventName as DomainEventName, async (event) => {
      try {
        const { handleMobileDomainEvent } = await import("./service");
        await handleMobileDomainEvent({
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
