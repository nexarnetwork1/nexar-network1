/**
 * ATLAS Connect event subscribers — workspace provisioning & ecosystem notifications.
 */

import { onDomainEvent } from "@/domains/events/bus";
import type { DomainEventName } from "@/domains/events/catalog";
import { CONNECT_EVENT_HANDLERS } from "./types";

let registered = false;

const CONNECT_EVENTS = Object.keys(CONNECT_EVENT_HANDLERS) as Array<
  keyof typeof CONNECT_EVENT_HANDLERS
>;

export function registerAtlasConnectEventHandlers(): void {
  if (registered) return;
  registered = true;

  for (const eventName of CONNECT_EVENTS) {
    onDomainEvent(eventName as DomainEventName, async (event) => {
      try {
        const handler = CONNECT_EVENT_HANDLERS[eventName];
        if (handler.action === "provision" && event.name === "business.created") {
          const businessId = event.businessId;
          if (!businessId || !event.actorId) return;
          const { ensureBusinessConnect } = await import("./service");
          const payload = event.payload as { displayName?: string; slug?: string };
          await ensureBusinessConnect({
            businessId,
            ownerUserId: event.actorId,
            displayName: payload.displayName ?? "Business",
            slug: payload.slug ?? businessId.slice(0, 8),
          });
          return;
        }
        const { handleConnectDomainEvent } = await import("./service");
        await handleConnectDomainEvent({
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
