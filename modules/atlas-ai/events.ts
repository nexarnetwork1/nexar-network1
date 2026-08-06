/**
 * ATLAS AI event subscribers — workspace provisioning & intelligence workflows.
 */

import { onDomainEvent } from "@/domains/events/bus";
import type { DomainEventName } from "@/domains/events/catalog";
import { AI_EVENT_HANDLERS } from "./types";

let registered = false;

const AI_EVENTS = Object.keys(AI_EVENT_HANDLERS) as Array<
  keyof typeof AI_EVENT_HANDLERS
>;

export function registerAtlasAiEventHandlers(): void {
  if (registered) return;
  registered = true;

  for (const eventName of AI_EVENTS) {
    onDomainEvent(eventName as DomainEventName, async (event) => {
      try {
        const handler = AI_EVENT_HANDLERS[eventName];
        if (handler.action === "provision" && event.name === "business.created") {
          const businessId = event.businessId;
          if (!businessId || !event.actorId) return;
          const { ensureBusinessAi } = await import("./service");
          const payload = event.payload as { displayName?: string; slug?: string };
          await ensureBusinessAi({
            businessId,
            ownerUserId: event.actorId,
            displayName: payload.displayName ?? "Business",
            slug: payload.slug ?? businessId.slice(0, 8),
          });
          return;
        }
        const { handleAiDomainEvent } = await import("./service");
        await handleAiDomainEvent({
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
