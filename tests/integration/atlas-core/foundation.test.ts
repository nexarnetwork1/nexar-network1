/**
 * ATLAS Core integration — wiring smoke (no DB).
 */
import { describe, expect, it } from "vitest";
import {
  ACTIVE_CONTEXTS,
  ATLAS_MODULE_CONTEXTS,
  ATLAS_CORE_MODULE,
} from "@/domains";
import type { AtlasCorePort } from "@/domains/contracts/ports";
import { planWorkflow } from "@/modules/atlas-core/workflows";
import { registerOutboxWriter, publishDomainEvent, onDomainEvent } from "@/domains/events/bus";
import { randomUUID } from "node:crypto";

describe("ATLAS Core integration foundation", () => {
  it("includes atlasCore in ACTIVE_CONTEXTS", () => {
    expect(ACTIVE_CONTEXTS).toContain("atlasCore");
    expect(ATLAS_MODULE_CONTEXTS.core).toBe("atlasCore");
    expect(ATLAS_CORE_MODULE.dbNamespace).toBe("atlas_core");
  });

  it("defines AtlasCorePort contract", () => {
    const keys: Array<keyof AtlasCorePort> = [
      "handleEvent",
      "search",
      "notify",
      "indexDocument",
    ];
    expect(keys).toHaveLength(4);
  });

  it("plans cross-module workflows without DB", () => {
    expect(planWorkflow("business.verification_approved")?.steps.length).toBeGreaterThan(
      3,
    );
  });

  it("supports outbox writer registration on the bus", async () => {
    const seen: string[] = [];
    registerOutboxWriter(async (event) => {
      seen.push(event.name);
    });
    const unsub = onDomainEvent("audit.recorded", () => undefined);
    await publishDomainEvent({
      id: randomUUID(),
      name: "audit.recorded",
      occurredAt: new Date(),
      actorId: null,
      businessId: null,
      payload: {},
      correlationId: randomUUID(),
    });
    expect(seen).toContain("audit.recorded");
    unsub();
  });
});
