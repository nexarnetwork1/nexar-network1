import { describe, expect, it } from "vitest";
import {
  hasRoleAccess,
  isProtectedRoute,
  getAllowedPrefixes,
} from "@/lib/middleware/authorization";

describe("authorization middleware helpers", () => {
  it("identifies protected routes", () => {
    expect(isProtectedRoute("/admin/dashboard")).toBe(true);
    expect(isProtectedRoute("/about")).toBe(false);
  });

  it("grants role-specific access", () => {
    expect(hasRoleAccess("/admin/users", "admin")).toBe(true);
    expect(hasRoleAccess("/admin/users", "customer")).toBe(false);
    expect(hasRoleAccess("/merchant/orders", "merchant")).toBe(true);
  });

  it("returns allowed prefixes per role", () => {
    expect(getAllowedPrefixes("customer")).toContain("/customer");
    expect(getAllowedPrefixes("merchant")).toContain("/merchant");
  });
});
