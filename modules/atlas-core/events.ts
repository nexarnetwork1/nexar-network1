/**
 * ATLAS Core — registers the integration spine on the domain bus.
 */

import { onDomainEvent, registerOutboxWriter } from "@/domains/events/bus";

let registered = false;

export function registerAtlasCoreEventHandlers(): void {
  if (registered) return;
  registered = true;

  registerOutboxWriter(async (event) => {
    const { writeOutboxFromEvent } = await import("./service");
    await writeOutboxFromEvent(event);
  });

  onDomainEvent("*", async (event) => {
    try {
      const {
        appendTimelineFromEvent,
        recordAnalyticsFromEvent,
        indexSearchFromEvent,
        fanOutNotificationFromEvent,
        runCoreOrchestration,
      } = await import("./service");
      await appendTimelineFromEvent(event);
      await recordAnalyticsFromEvent(event);
      await indexSearchFromEvent(event);
      await fanOutNotificationFromEvent(event);
      await runCoreOrchestration(event);
    } catch {
      /* non-fatal */
    }
  });
}
