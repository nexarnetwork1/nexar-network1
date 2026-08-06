import { describe, expect, it } from "vitest";
import {
  canTransitionBusinessStatus,
} from "@/modules/business-hub/lifecycle";
import {
  resolvePermissions,
  hasPermission,
  permissionsForBusinessMember,
} from "@/domains";

describe("Business Hub lifecycle", () => {
  it("allows pending → active and active → suspended", () => {
    expect(canTransitionBusinessStatus("pending", "active")).toBe(true);
    expect(canTransitionBusinessStatus("active", "suspended")).toBe(true);
    expect(canTransitionBusinessStatus("closed", "active")).toBe(false);
    expect(canTransitionBusinessStatus("draft", "active")).toBe(false);
  });
});

describe("Business Hub membership permissions", () => {
  it("owner membership grants member management + catalog publish", () => {
    const member = permissionsForBusinessMember("owner");
    expect(hasPermission(member, "business:members:manage")).toBe(true);
    expect(hasPermission(member, "catalog:product:publish")).toBe(true);
  });

  it("viewer cannot manage members", () => {
    const perms = resolvePermissions({
      platformRole: "customer",
      businessMembership: "viewer",
    });
    expect(hasPermission(perms, "business:read")).toBe(true);
    expect(hasPermission(perms, "business:members:manage")).toBe(false);
  });

  it("staff can fulfill orders but not publish products", () => {
    const perms = resolvePermissions({
      platformRole: "merchant",
      businessMembership: "staff",
    });
    expect(hasPermission(perms, "orders:fulfill")).toBe(true);
    // platform merchant still has publish; membership alone for staff does not
    const staffOnly = permissionsForBusinessMember("staff");
    expect(hasPermission(staffOnly, "catalog:product:publish")).toBe(false);
  });
});
