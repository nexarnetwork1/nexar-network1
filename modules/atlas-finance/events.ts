/**
 * ATLAS Finance event subscribers — workspace provision & payment posting.
 */

import { onDomainEvent } from "@/domains/events/bus";
import type { DomainEventName } from "@/domains/events/catalog";
import { FINANCE_EVENT_HANDLERS } from "./types";

let registered = false;

const FINANCE_EVENTS = Object.keys(FINANCE_EVENT_HANDLERS) as Array<
  keyof typeof FINANCE_EVENT_HANDLERS
>;

export function registerAtlasFinanceEventHandlers(): void {
  if (registered) return;
  registered = true;

  for (const eventName of FINANCE_EVENTS) {
    onDomainEvent(eventName as DomainEventName, async (event) => {
      try {
        if (event.name === "business.created") {
          const businessId = event.businessId;
          if (!businessId) return;
          const { ensureFinanceWorkspace } = await import("./service");
          await ensureFinanceWorkspace({
            businessId,
            actorUserId: event.actorId ?? undefined,
          });
          return;
        }
        const { handleFinanceDomainEvent } = await import("./service");
        await handleFinanceDomainEvent({
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
