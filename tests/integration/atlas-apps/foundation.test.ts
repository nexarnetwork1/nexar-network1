/**
 * ATLAS Apps foundation — domain wiring smoke (no DB).
 */
import { describe, expect, it } from "vitest";
import {
  ACTIVE_CONTEXTS,
  ATLAS_MODULE_CONTEXTS,
  ATLAS_APPS_MODULE,
} from "@/domains";
import type { AtlasAppsPort } from "@/domains/contracts/ports";

describe("ATLAS Apps integration foundation", () => {
  it("includes atlasApps in ACTIVE_CONTEXTS", () => {
    expect(ACTIVE_CONTEXTS).toContain("atlasApps");
  });

  it("maps ATLAS apps module to atlasApps context", () => {
    expect(ATLAS_MODULE_CONTEXTS.apps).toBe("atlasApps");
    expect(ATLAS_MODULE_CONTEXTS.crm).toBe("atlasApps");
    expect(ATLAS_APPS_MODULE.dbNamespace).toBe("atlas_apps");
  });

  it("defines AtlasAppsPort contract shape", () => {
    const required: Array<keyof AtlasAppsPort> = [
      "discover",
      "getBySlug",
      "listInstalled",
      "install",
      "enable",
      "disable",
      "uninstall",
      "recommend",
    ];
    expect(required).toHaveLength(8);
  });
});
