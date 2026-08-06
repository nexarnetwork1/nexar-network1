/**
 * NEXAR HQ event subscribers.
 */

import { onDomainEvent } from "@/domains/events/bus";

let registered = false;

export function registerAtlasHqEventHandlers(): void {
  if (registered) return;
  registered = true;

  onDomainEvent("user.logged_in", async (event) => {
    try {
      const userId = event.actorId ?? (event.payload.userId as string | undefined);
      if (!userId) return;
      const { getPlatformOwnerByUserId } = await import("./repository");
      const owner = await getPlatformOwnerByUserId(userId);
      if (!owner) return;
      const { recordPlatformOwnerLogin } = await import("./service");
      await recordPlatformOwnerLogin(userId);
    } catch {
      /* non-fatal */
    }
  });

  onDomainEvent("hq.bootstrapped", async () => {
    /* audit spine already records via Core wildcard */
  });
}
