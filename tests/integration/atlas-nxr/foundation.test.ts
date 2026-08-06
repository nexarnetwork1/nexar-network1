/**
 * ATLAS NXR foundation — domain wiring smoke (no DB).
 */
import { describe, expect, it } from "vitest";
import {
  ACTIVE_CONTEXTS,
  ATLAS_MODULE_CONTEXTS,
  ATLAS_NXR_MODULE,
} from "@/domains";
import type { AtlasNxrPort } from "@/domains/contracts/ports";
import { applyTransfer } from "@/modules/atlas-nxr/ledger";
import { createEmptyBlockchainRegistry } from "@/modules/atlas-nxr/blockchain-adapters";

describe("ATLAS NXR integration foundation", () => {
  it("includes nxrToken in ACTIVE_CONTEXTS", () => {
    expect(ACTIVE_CONTEXTS).toContain("nxrToken");
  });

  it("maps ATLAS nxr module to nxrToken context", () => {
    expect(ATLAS_MODULE_CONTEXTS.nxr).toBe("nxrToken");
    expect(ATLAS_NXR_MODULE.dbNamespace).toBe("atlas_nxr");
    expect(ATLAS_NXR_MODULE.blockchainRequired).toBe(false);
  });

  it("defines AtlasNxrPort contract shape", () => {
    const required: Array<keyof AtlasNxrPort> = [
      "ensureAccount",
      "getAccount",
      "transfer",
      "pay",
      "grantReward",
      "fund",
      "activatePremium",
    ];
    expect(required).toHaveLength(7);
  });

  it("keeps ledger and adapters importable without server-only", () => {
    expect(applyTransfer({ fromBalance: 1, toBalance: 0, amount: 1 }).ok).toBe(
      true,
    );
    expect(createEmptyBlockchainRegistry()).toEqual({});
  });
});
