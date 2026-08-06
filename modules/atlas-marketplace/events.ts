/**
 * ATLAS Marketplace event subscribers — storefront provision & listing sync.
 */

import { onDomainEvent } from "@/domains/events/bus";
import type { DomainEventName } from "@/domains/events/catalog";
import { MARKETPLACE_EVENT_HANDLERS } from "./types";

let registered = false;

const MARKETPLACE_EVENTS = Object.keys(MARKETPLACE_EVENT_HANDLERS) as Array<
  keyof typeof MARKETPLACE_EVENT_HANDLERS
>;

export function registerAtlasMarketplaceEventHandlers(): void {
  if (registered) return;
  registered = true;

  for (const eventName of MARKETPLACE_EVENTS) {
    onDomainEvent(eventName as DomainEventName, async (event) => {
      try {
        const handler = MARKETPLACE_EVENT_HANDLERS[eventName];
        if (handler.action === "provision" && event.name === "business.created") {
          const businessId = event.businessId;
          if (!businessId || !event.actorId) return;
          const { ensureMarketplaceStorefront } = await import("./service");
          const payload = event.payload as {
            displayName?: string;
            slug?: string;
            storeId?: string;
          };
          await ensureMarketplaceStorefront({
            businessId,
            ownerUserId: event.actorId,
            displayName: payload.displayName ?? "Business",
            slug: payload.slug ?? businessId.slice(0, 8),
            storeId: payload.storeId,
          });
          return;
        }
        const { handleMarketplaceDomainEvent } = await import("./service");
        await handleMarketplaceDomainEvent({
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
