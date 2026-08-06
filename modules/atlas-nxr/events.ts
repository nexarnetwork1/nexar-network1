/**
 * ATLAS NXR event subscribers — provision accounts & rewards.
 */

import { onDomainEvent } from "@/domains/events/bus";
import type { DomainEventName } from "@/domains/events/catalog";
import { NXR_EVENT_HANDLERS } from "./types";

let registered = false;

const NXR_EVENTS = Object.keys(NXR_EVENT_HANDLERS) as Array<
  keyof typeof NXR_EVENT_HANDLERS
>;

export function registerAtlasNxrEventHandlers(): void {
  if (registered) return;
  registered = true;

  for (const eventName of NXR_EVENTS) {
    onDomainEvent(eventName as DomainEventName, async (event) => {
      try {
        const { handleNxrDomainEvent } = await import("./service");
        await handleNxrDomainEvent({
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
