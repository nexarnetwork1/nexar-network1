/**
 * ATLAS Pulse event subscribers — ingest all ecosystem activity.
 */

import { onDomainEvent } from "@/domains/events/bus";
import type { DomainEventName } from "@/domains/events/catalog";
import { PULSE_EVENT_MAP } from "./types";

let registered = false;

const PULSE_EVENTS = Object.keys(PULSE_EVENT_MAP) as Array<
  keyof typeof PULSE_EVENT_MAP
>;

export function registerAtlasPulseEventHandlers(): void {
  if (registered) return;
  registered = true;

  for (const eventName of PULSE_EVENTS) {
    onDomainEvent(eventName as DomainEventName, async (event) => {
      try {
        const { ingestFromDomainEvent } = await import("./service");
        await ingestFromDomainEvent({
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

  onDomainEvent("business.created", async (event) => {
    const businessId = event.businessId;
    if (!businessId || !event.actorId) return;
    try {
      const { ensureBusinessPulse } = await import("./service");
      const payload = event.payload as { displayName?: string };
      await ensureBusinessPulse({
        businessId,
        ownerUserId: event.actorId,
        displayName: payload.displayName ?? "Business",
      });
    } catch {
      /* DB trigger may have provisioned feed */
    }
  });
}
