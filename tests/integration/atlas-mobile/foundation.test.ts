/**
 * ATLAS Mobile foundation — domain wiring smoke (no DB).
 */
import { describe, expect, it } from "vitest";
import {
  ACTIVE_CONTEXTS,
  ATLAS_MODULE_CONTEXTS,
  ATLAS_MOBILE_MODULE,
} from "@/domains";
import type { AtlasMobilePort } from "@/domains/contracts/ports";
import { resolveConflict } from "@/modules/atlas-mobile/offline";
import { parseDeepLink } from "@/modules/atlas-mobile/deep-links";

describe("ATLAS Mobile integration foundation", () => {
  it("includes atlasMobile in ACTIVE_CONTEXTS", () => {
    expect(ACTIVE_CONTEXTS).toContain("atlasMobile");
  });

  it("maps ATLAS mobile module to atlasMobile context", () => {
    expect(ATLAS_MODULE_CONTEXTS.mobile).toBe("atlasMobile");
    expect(ATLAS_MOBILE_MODULE.dbNamespace).toBe("atlas_mobile");
    expect(ATLAS_MOBILE_MODULE.role).toBe("mobile_platform");
  });

  it("defines AtlasMobilePort contract shape", () => {
    const required: Array<keyof AtlasMobilePort> = [
      "registerDevice",
      "queuePush",
      "enqueueOfflineMutation",
      "processOfflineSync",
      "pullSync",
      "remoteLogout",
      "parseDeepLink",
    ];
    expect(required).toHaveLength(7);
  });

  it("keeps offline and deep-link engines importable without server-only", () => {
    expect(
      resolveConflict({
        mutation: {
          clientMutationId: "x",
          entityType: "draft",
          operation: "create",
          payload: {},
        },
        server: null,
      }).status,
    ).toBe("apply");
    expect(parseDeepLink("/wallet")?.targetModule).toBe("wallet");
  });
});
