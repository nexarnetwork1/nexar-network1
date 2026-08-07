import { describe, expect, it } from "vitest";
import {
  PLATFORM_OWNER_EMAIL,
  HQ_STAFF_ROLES,
  HQ_WEBSITE_PAGE_KEYS,
  HQ_MODULE_SECTIONS,
  HQ_ROLE_DASHBOARDS,
  NEXAR_NETWORK_BUSINESS,
} from "@/modules/atlas-hq/types";
import {
  atlasSidebarModules,
  canSeeNexarHq,
  dashboardsForStaffRole,
  isPlatformOwnerEmail,
  isPlatformOwnerRole,
  assertCanMutatePlatformOwner,
  isHqStaffRole,
} from "@/modules/atlas-hq/founder";
import {
  ownerOf,
  BOUNDED_CONTEXTS,
  ATLAS_HQ_MODULE,
  resolvePermissions,
  hasPermission,
  DOMAIN_EVENTS,
} from "@/domains";
import { ATLAS_ROOT_MODULES } from "@/config/atlas-nav";
import { LEGACY_ADMIN_TO_HQ, NEXAR_HQ_NAV } from "@/config/nexar-hq-nav";
import { getDashboardPath } from "@/lib/auth/redirect";

describe("NEXAR HQ bounded context", () => {
  it("registers atlasHq as sole administration spine", () => {
    expect(BOUNDED_CONTEXTS.atlasHq.id).toBe("atlas_hq");
    expect(BOUNDED_CONTEXTS.atlasHq.owns).toContain("HqPlatformOwner");
    expect(BOUNDED_CONTEXTS.atlasHq.owns).toContain("HqAnnouncement");
    expect(ownerOf("HqWebsitePage")).toBe("atlasHq");
    expect(ownerOf("AdminAction")).toBe("atlasHq");
    expect(ATLAS_HQ_MODULE.role).toBe("internal_administration");
    expect(ATLAS_HQ_MODULE.platformOwnerEmail).toBe(PLATFORM_OWNER_EMAIL);
  });

  it("maps nexar-hq in ATLAS nav (internal)", () => {
    const m = ATLAS_ROOT_MODULES.find((x) => x.id === "nexar-hq");
    expect(m?.boundedContext).toBe("atlasHq");
    expect(NEXAR_HQ_NAV.length).toBe(HQ_MODULE_SECTIONS.length);
    expect(LEGACY_ADMIN_TO_HQ["/admin/news-ticker"]).toBe("website");
  });

  it("catalogs HQ domain events", () => {
    expect(DOMAIN_EVENTS).toContain("hq.bootstrapped");
    expect(DOMAIN_EVENTS).toContain("hq.announcement_updated");
  });
});

describe("NEXAR HQ founder detection", () => {
  it("recognizes Platform Owner email and role", () => {
    expect(isPlatformOwnerEmail(PLATFORM_OWNER_EMAIL)).toBe(true);
    expect(isPlatformOwnerEmail("Admin@NexarNetwork.org")).toBe(true);
    expect(isPlatformOwnerEmail("customer@example.com")).toBe(false);
    expect(isPlatformOwnerRole("platform_owner")).toBe(true);
    expect(isPlatformOwnerRole("customer")).toBe(false);
  });

  it("hides HQ from customers", () => {
    expect(canSeeNexarHq({ role: "customer" })).toBe(false);
    expect(canSeeNexarHq({ role: "merchant" })).toBe(false);
    expect(canSeeNexarHq({ isPlatformOwner: true })).toBe(true);
    expect(canSeeNexarHq({ isHqStaff: true })).toBe(true);
  });

  it("protects Platform Owner from team mutations", () => {
    expect(() =>
      assertCanMutatePlatformOwner(true, "delete"),
    ).toThrow(/permanent/);
    expect(() => assertCanMutatePlatformOwner(true, "demote")).toThrow();
    expect(() => assertCanMutatePlatformOwner(false, "delete")).not.toThrow();
  });

  it("builds sidebar with HQ only for owners/staff", () => {
    const normal = atlasSidebarModules({ showNexarHq: false });
    expect(normal.some((m) => m.id === "nexar-hq")).toBe(false);
    const owner = atlasSidebarModules({ showNexarHq: true });
    expect(owner.some((m) => m.id === "nexar-hq")).toBe(true);
  });
});

describe("NEXAR HQ roles & website contracts", () => {
  it("defines staff roles and website page keys", () => {
    expect(HQ_STAFF_ROLES).toContain("support");
    expect(HQ_STAFF_ROLES).toContain("devops");
    expect(HQ_WEBSITE_PAGE_KEYS).toContain("home");
    expect(HQ_WEBSITE_PAGE_KEYS).toContain("announcement_bar");
    expect(HQ_WEBSITE_PAGE_KEYS.length).toBeGreaterThan(20);
    expect(NEXAR_NETWORK_BUSINESS.slug).toBe("nexar-network");
    expect(isHqStaffRole("marketing")).toBe(true);
    expect(dashboardsForStaffRole("content")).toEqual(
      HQ_ROLE_DASHBOARDS.content,
    );
    expect(dashboardsForStaffRole("platform_owner").length).toBeGreaterThan(10);
  });

  it("grants platform_owner full HQ permissions", () => {
    const perms = resolvePermissions({ platformRole: "platform_owner" });
    expect(hasPermission(perms, "hq:access")).toBe(true);
    expect(hasPermission(perms, "hq:team:manage")).toBe(true);
    expect(hasPermission(perms, "hq:website:manage")).toBe(true);
    expect(hasPermission(perms, "hq:bootstrap:run")).toBe(true);
  });

  it("denies HQ permissions to customers", () => {
    const perms = resolvePermissions({ platformRole: "customer" });
    expect(hasPermission(perms, "hq:access")).toBe(false);
  });

  it("routes Platform Owner into ATLAS dashboard not marketplace", () => {
    expect(getDashboardPath("platform_owner")).toContain("/dashboard");
    expect(getDashboardPath("customer")).toBe("/dashboard");
  });
});
