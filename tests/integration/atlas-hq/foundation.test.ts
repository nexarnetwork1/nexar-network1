/**
 * NEXAR HQ integration — Phase 12 production readiness smoke.
 */
import { describe, expect, it } from "vitest";
import {
  ACTIVE_CONTEXTS,
  ATLAS_MODULE_CONTEXTS,
  ATLAS_HQ_MODULE,
} from "@/domains";
import type { AtlasHqPort } from "@/domains/contracts/ports";
import { resolvePostLoginPath } from "@/modules/atlas-hq/founder";
import type { HqSessionContext } from "@/modules/atlas-hq/types";
import {
  resolveBootstrapOwnerEmail,
  resolveBootstrapPasswordPlaintext,
  BCRYPT_ROUNDS_HQ,
} from "@/modules/atlas-hq/constants";
import { isHqRoute, isHqPublicRoute } from "@/lib/admin/routes";
import bcrypt from "bcrypt";

describe("NEXAR HQ integration foundation", () => {
  it("includes atlasHq in ACTIVE_CONTEXTS", () => {
    expect(ACTIVE_CONTEXTS).toContain("atlasHq");
    expect(ATLAS_MODULE_CONTEXTS["nexar-hq"]).toBe("atlasHq");
    expect(ATLAS_HQ_MODULE.dbNamespace).toBe("atlas_hq");
  });

  it("defines AtlasHqPort contract", () => {
    const keys: Array<keyof AtlasHqPort> = [
      "resolveSession",
      "listTeam",
      "getActiveAnnouncements",
      "listWebsitePages",
      "ensureBootstrap",
    ];
    expect(keys).toHaveLength(5);
  });

  it("never ships a hardcoded bootstrap password", () => {
    expect(resolveBootstrapPasswordPlaintext()).toBeNull();
  });

  it("hashes wizard passwords with bcrypt 12 — never plaintext in DB path", async () => {
    const plain = "Wizard-Test-Password-12!";
    const hash = await bcrypt.hash(plain, BCRYPT_ROUNDS_HQ);
    expect(hash.startsWith("$2")).toBe(true);
    expect(hash).not.toContain(plain);
    expect(await bcrypt.compare(plain, hash)).toBe(true);
  });

  it("resolves default owner email for wizard prefills", () => {
    expect(resolveBootstrapOwnerEmail()).toBe("admin@nexarnetwork.org");
  });

  it("gates HQ routes without wallet public APIs", () => {
    expect(isHqRoute("/admin/dashboard")).toBe(true);
    expect(isHqPublicRoute("/admin/setup")).toBe(true);
    expect(isHqPublicRoute("/admin/login")).toBe(true);
    expect(isHqPublicRoute("/api/hq/bootstrap")).toBe(true);
    expect(isHqPublicRoute("/api/admin/wallet/status")).toBe(false);
  });

  it("routes Platform Owner through password/2FA gates then ATLAS", () => {
    const base: HqSessionContext = {
      userId: "u1",
      isPlatformOwner: true,
      hqEnabled: true,
      hqVisibleInSidebar: true,
      nexarBusinessId: "b1",
      nexarWorkspaceId: "w1",
      staffRole: "platform_owner",
      allowedSections: ["dashboard"],
      mustChangePassword: true,
      mustEnable2fa: true,
    };
    expect(resolvePostLoginPath(base)).toContain("change-password");
    expect(
      resolvePostLoginPath({ ...base, mustChangePassword: false }),
    ).toContain("enable-2fa");
    expect(
      resolvePostLoginPath({
        ...base,
        mustChangePassword: false,
        mustEnable2fa: false,
      }),
    ).toContain("/dashboard");
  });
});
