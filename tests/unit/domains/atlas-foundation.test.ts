import { describe, expect, it } from "vitest";
import {
  AGGREGATE_OWNER,
  ATLAS_BUSINESS_MODULE,
  ATLAS_MARKETPLACE_MODULE,
  ATLAS_PLATFORM,
  BOUNDED_CONTEXTS,
  DOMAIN_EVENTS,
  ownerOf,
  permissionsForPlatformRole,
  resolvePermissions,
  hasPermission,
  onDomainEvent,
  publishDomainEvent,
  type DomainEvent,
} from "@/domains";
import { ATLAS_ROOT_MODULES } from "@/config/atlas-nav";
import { ATLAS_BRAND } from "@/config/atlas-branding";

describe("ATLAS platform identity", () => {
  it("exposes official public branding", () => {
    expect(ATLAS_BRAND.name).toBe("ATLAS");
    expect(ATLAS_BRAND.byline).toBe("by NEXAR NETWORK");
    expect(ATLAS_PLATFORM.tagline).toBe("Business Operating System");
  });

  it("maps Business capability to legacy businessHub context", () => {
    expect(ATLAS_BUSINESS_MODULE.publicName).toBe("Business");
    expect(ATLAS_BUSINESS_MODULE.internalContext).toBe("businessHub");
    expect(ATLAS_BUSINESS_MODULE.internalModulePath).toBe("modules/business-hub");
  });

  it("defines Marketplace as sales channel only", () => {
    expect(ATLAS_MARKETPLACE_MODULE.role).toBe("sales_channel");
    expect(ATLAS_MARKETPLACE_MODULE.owns).toContain("Listing");
    expect(ATLAS_MARKETPLACE_MODULE.consumes).toContain("Product");
  });

  it("declares the full ATLAS root module tree", () => {
    const ids = ATLAS_ROOT_MODULES.map((m) => m.id);
    expect(ids).toContain("business");
    expect(ids).toContain("marketplace");
    expect(ids).toContain("network");
    expect(ids).toContain("feed");
    expect(ids).toContain("connect");
    expect(ids).toContain("wallet");
    expect(ids).toContain("apps");
    expect(ids).toContain("settings");
    expect(getAtlasBusinessModule().boundedContext).toBe("businessHub");
  });
});

function getAtlasBusinessModule() {
  const mod = ATLAS_ROOT_MODULES.find((m) => m.id === "business");
  if (!mod) throw new Error("business module missing");
  return mod;
}

describe("ATLAS bounded context map", () => {
  it("centers Business as an owned context (internal: businessHub)", () => {
    expect(BOUNDED_CONTEXTS.businessHub.id).toBe("business_hub");
    expect(BOUNDED_CONTEXTS.businessHub.atlasModule).toBe("business");
    expect(BOUNDED_CONTEXTS.businessHub.owns).toContain("Business");
  });

  it("assigns each critical aggregate to exactly one owner", () => {
    expect(ownerOf("Business")).toBe("businessHub");
    expect(ownerOf("Product")).toBe("businessHub");
    expect(ownerOf("Order")).toBe("orders");
    expect(ownerOf("Payment")).toBe("payments");
    expect(ownerOf("User")).toBe("authentication");
    expect(AGGREGATE_OWNER.Store).toBe("businessHub");
  });

  it("assigns Product master ownership to ATLAS Business", () => {
    expect(ownerOf("Product")).toBe("businessHub");
    expect(ownerOf("Product")).not.toBe("marketplace");
    expect(ownerOf("Store")).toBe("businessHub");
  });

  it("assigns business-scoped capabilities to ATLAS Business", () => {
    expect(ownerOf("Employee")).toBe("businessHub");
    expect(ownerOf("BusinessWallet")).toBe("businessHub");
    expect(ownerOf("BusinessAnalytics")).toBe("businessHub");
    expect(ownerOf("BusinessAiContext")).toBe("businessHub");
    expect(ownerOf("BusinessSettings")).toBe("businessHub");
  });

  it("assigns ATLAS Network social aggregates to atlasNetwork", () => {
    expect(ownerOf("Profile")).toBe("atlasNetwork");
    expect(ownerOf("Post")).toBe("atlasNetwork");
    expect(BOUNDED_CONTEXTS.atlasNetwork.atlasModule).toBe("network");
  });

  it("keeps marketplace from owning Product master data", () => {
    expect(ownerOf("Listing")).toBe("marketplace");
    expect(BOUNDED_CONTEXTS.marketplace.atlasModule).toBe("marketplace");
  });
});

describe("ATLAS permission matrix", () => {
  it("grants business role company + commerce capabilities", () => {
    const perms = permissionsForPlatformRole("business");
    expect(hasPermission(perms, "business:members:manage")).toBe(true);
    expect(hasPermission(perms, "catalog:product:publish")).toBe(true);
    expect(hasPermission(perms, "super_admin:treasury")).toBe(false);
  });

  it("merges platform + membership permissions without duplicates", () => {
    const perms = resolvePermissions({
      platformRole: "customer",
      businessMembership: "viewer",
    });
    expect(new Set(perms).size).toBe(perms.length);
    expect(hasPermission(perms, "business:read")).toBe(true);
    expect(hasPermission(perms, "marketplace:order:place")).toBe(true);
  });
});

describe("ATLAS domain event bus", () => {
  it("publishes to subscribers", async () => {
    const seen: string[] = [];
    const off = onDomainEvent("business.created", (e) => {
      seen.push(e.name);
    });

    const event: DomainEvent = {
      id: "evt_1",
      name: "business.created",
      occurredAt: new Date(),
      actorId: "user_1",
      businessId: "biz_1",
      payload: { legalName: "Acme" },
      correlationId: "corr_1",
    };

    await publishDomainEvent(event);
    off();
    expect(seen).toEqual(["business.created"]);
    expect(DOMAIN_EVENTS).toContain("order.paid");
  });
});
