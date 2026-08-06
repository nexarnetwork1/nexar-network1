import { describe, expect, it } from "vitest";
import {
  SYSTEM_APP_SLUGS,
  APPS_EVENT_HANDLERS,
} from "@/modules/atlas-apps/types";
import {
  DEFAULT_SANDBOX_POLICY,
  runLifecycleStub,
  validateManifest,
} from "@/modules/atlas-apps/plugins";
import {
  recommendApps,
  recommendStarterApps,
} from "@/modules/atlas-apps/recommendations";
import {
  installAppSchema,
  discoverAppsSchema,
  publishVersionSchema,
} from "@/modules/atlas-apps/validators";
import {
  ownerOf,
  BOUNDED_CONTEXTS,
  DOMAIN_EVENTS,
  hasPermission,
  permissionsForPlatformRole,
  ATLAS_APPS_MODULE,
} from "@/domains";
import { ATLAS_ROOT_MODULES } from "@/config/atlas-nav";

describe("ATLAS Apps bounded context", () => {
  it("registers atlasApps as application platform", () => {
    expect(BOUNDED_CONTEXTS.atlasApps.id).toBe("atlas_apps");
    expect(BOUNDED_CONTEXTS.atlasApps.atlasModule).toBe("apps");
    expect(BOUNDED_CONTEXTS.atlasApps.owns).toContain("AppApplication");
    expect(BOUNDED_CONTEXTS.atlasApps.owns).toContain("AppInstall");
  });

  it("never owns Business/Product/Order masters", () => {
    expect(ownerOf("Business")).toBe("businessHub");
    expect(ownerOf("Product")).toBe("businessHub");
    expect(ownerOf("Order")).toBe("orders");
    expect(ownerOf("AppApplication")).toBe("atlasApps");
    expect(ownerOf("AppInstall")).toBe("atlasApps");
    expect(ownerOf("Application")).toBe("jobs");
  });

  it("declares Apps module as application_platform", () => {
    expect(ATLAS_APPS_MODULE.role).toBe("application_platform");
    expect(ATLAS_APPS_MODULE.internalModulePath).toBe("modules/atlas-apps");
    expect(ATLAS_APPS_MODULE.consumes).toContain("Business");
  });

  it("maps apps nav to atlasApps context", () => {
    const m = ATLAS_ROOT_MODULES.find((x) => x.id === "apps");
    expect(m?.boundedContext).toBe("atlasApps");
    expect(m?.status).toBe("foundation");
  });
});

describe("ATLAS Apps plugins & recommendations", () => {
  it("validates plugin manifests and sandbox policy", () => {
    expect(DEFAULT_SANDBOX_POLICY.permissionIsolation).toBe(true);
    const ok = validateManifest({
      pluginApi: "1.0",
      name: "CRM",
      slug: "atlas-crm",
      version: "1.0.0",
      permissions: [{ scope: "crm", accessLevel: "write" }],
    });
    expect(ok.valid).toBe(true);
    expect(validateManifest({} as never).valid).toBe(false);

    const result = runLifecycleStub("onInstall", {
      businessId: "b",
      installId: "i",
      applicationId: "a",
      version: "1.0.0",
      settings: {},
    });
    expect(result.ok).toBe(true);
  });

  it("recommends apps from business signals", () => {
    expect(recommendStarterApps()).toContain("crm");
    const ranked = recommendApps(
      { hasProducts: true, hasOrders: true, employeeCount: 10 },
      [
        {
          applicationId: "1",
          slug: "atlas-inventory",
          categorySlug: "inventory",
          baseScore: 5,
        },
        {
          applicationId: "2",
          slug: "atlas-hr",
          categorySlug: "hr",
          baseScore: 5,
          isVerified: true,
        },
        {
          applicationId: "3",
          slug: "atlas-crm",
          categorySlug: "crm",
          baseScore: 5,
          isFeatured: true,
        },
      ],
    );
    expect(ranked.map((r) => r.slug)).toEqual(
      expect.arrayContaining(["atlas-inventory", "atlas-crm", "atlas-hr"]),
    );
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
    expect(ranked.find((r) => r.slug === "atlas-inventory")?.reason).toContain(
      "You sell products",
    );
  });

  it("lists system app slugs", () => {
    expect(SYSTEM_APP_SLUGS).toContain("atlas-crm");
    expect(SYSTEM_APP_SLUGS).toContain("atlas-finance");
  });
});

describe("ATLAS Apps validators", () => {
  it("validates install and discover inputs", () => {
    expect(() =>
      installAppSchema.parse({
        applicationId: "00000000-0000-4000-8000-000000000001",
        businessId: "00000000-0000-4000-8000-000000000002",
        installedBy: "00000000-0000-4000-8000-000000000003",
      }),
    ).not.toThrow();

    expect(() =>
      discoverAppsSchema.parse({
        categorySlug: "crm",
        featuredOnly: true,
        limit: 20,
      }),
    ).not.toThrow();

    expect(() =>
      publishVersionSchema.parse({
        applicationId: "00000000-0000-4000-8000-000000000001",
        version: "1.1.0",
        developerId: "00000000-0000-4000-8000-000000000004",
        manifest: { pluginApi: "1.0" },
      }),
    ).not.toThrow();
  });
});

describe("ATLAS Apps events & permissions", () => {
  it("catalogs apps domain events", () => {
    expect(DOMAIN_EVENTS).toContain("apps.application_installed");
    expect(DOMAIN_EVENTS).toContain("apps.application_updated");
    expect(DOMAIN_EVENTS).toContain("apps.application_removed");
    expect(DOMAIN_EVENTS).toContain("apps.application_enabled");
    expect(DOMAIN_EVENTS).toContain("apps.application_disabled");
  });

  it("registers business signal handlers", () => {
    expect(APPS_EVENT_HANDLERS["business.created"].action).toBe("recommend");
    expect(APPS_EVENT_HANDLERS["product.published"]).toBeDefined();
    expect(APPS_EVENT_HANDLERS["order.paid"]).toBeDefined();
  });

  it("grants merchant apps permissions", () => {
    expect(hasPermission(permissionsForPlatformRole("merchant"), "apps:install")).toBe(
      true,
    );
    expect(
      hasPermission(permissionsForPlatformRole("merchant"), "apps:store:browse"),
    ).toBe(true);
    expect(
      hasPermission(permissionsForPlatformRole("customer"), "apps:install"),
    ).toBe(false);
  });
});
