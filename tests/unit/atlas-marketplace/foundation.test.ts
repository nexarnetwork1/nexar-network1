import { describe, expect, it } from "vitest";
import {
  MARKETPLACE_CONSUMES,
  MARKETPLACE_EVENT_HANDLERS,
} from "@/modules/atlas-marketplace/types";
import {
  createMarketplaceAiStub,
  MARKETPLACE_AI_ACTIONS,
} from "@/modules/atlas-marketplace/ai";
import { scoreListingRecommendations } from "@/modules/atlas-marketplace/recommendations";
import {
  publishListingSchema,
  ensureStorefrontSchema,
  searchListingsSchema,
} from "@/modules/atlas-marketplace/validators";
import {
  ownerOf,
  BOUNDED_CONTEXTS,
  DOMAIN_EVENTS,
  hasPermission,
  permissionsForPlatformRole,
  ATLAS_MARKETPLACE_MODULE,
} from "@/domains";
import { ATLAS_ROOT_MODULES } from "@/config/atlas-nav";
import { PULSE_EVENT_MAP } from "@/modules/atlas-pulse/types";

describe("ATLAS Marketplace bounded context", () => {
  it("keeps marketplace context as sales channel", () => {
    expect(BOUNDED_CONTEXTS.marketplace.id).toBe("marketplace");
    expect(BOUNDED_CONTEXTS.marketplace.atlasModule).toBe("marketplace");
    expect(BOUNDED_CONTEXTS.marketplace.owns).toContain("MarketplaceListing");
    expect(BOUNDED_CONTEXTS.marketplace.owns).toContain("MarketplaceStorefront");
  });

  it("never owns Product or Store masters", () => {
    expect(ownerOf("Product")).toBe("businessHub");
    expect(ownerOf("Store")).toBe("businessHub");
    expect(ownerOf("MarketplaceListing")).toBe("marketplace");
    expect(ownerOf("MarketplaceStorefront")).toBe("marketplace");
    expect(ownerOf("Order")).toBe("orders");
    expect(MARKETPLACE_CONSUMES).toContain("Product");
    expect(MARKETPLACE_CONSUMES).toContain("Store");
  });

  it("declares Marketplace module as sales_channel", () => {
    expect(ATLAS_MARKETPLACE_MODULE.role).toBe("sales_channel");
    expect(ATLAS_MARKETPLACE_MODULE.internalModulePath).toBe(
      "modules/atlas-marketplace",
    );
    expect(ATLAS_MARKETPLACE_MODULE.consumes).toContain("Product");
  });

  it("maps marketplace nav to marketplace context", () => {
    const m = ATLAS_ROOT_MODULES.find((x) => x.id === "marketplace");
    expect(m?.boundedContext).toBe("marketplace");
    expect(m?.status).toBe("foundation");
  });
});

describe("ATLAS Marketplace AI & recommendations", () => {
  it("lists commerce AI actions", () => {
    expect(MARKETPLACE_AI_ACTIONS).toContain("generate_description");
    expect(MARKETPLACE_AI_ACTIONS).toContain("detect_fraud");
    const stub = createMarketplaceAiStub({
      action: "suggest_price",
      businessId: "00000000-0000-4000-8000-000000000001",
    });
    expect(stub.status).toBe("stub");
  });

  it("scores listing recommendations", () => {
    const ranked = scoreListingRecommendations(
      { recentCategoryIds: ["c1"], preferFeatured: true },
      [
        {
          listingId: "a",
          score: 10,
          categoryId: "c1",
          isFeatured: true,
        },
        { listingId: "b", score: 40, categoryId: "c2" },
      ],
    );
    expect(ranked[0].listingId).toBe("a");
  });
});

describe("ATLAS Marketplace validators", () => {
  it("validates storefront and listing inputs", () => {
    expect(() =>
      ensureStorefrontSchema.parse({
        businessId: "00000000-0000-4000-8000-000000000001",
        ownerUserId: "00000000-0000-4000-8000-000000000002",
        displayName: "Acme",
        slug: "acme",
      }),
    ).not.toThrow();

    expect(() =>
      publishListingSchema.parse({
        storefrontId: "00000000-0000-4000-8000-000000000001",
        businessId: "00000000-0000-4000-8000-000000000003",
        sellingType: "physical",
        title: "Widget",
        slug: "widget",
        actorUserId: "00000000-0000-4000-8000-000000000002",
      }),
    ).not.toThrow();

    expect(() =>
      searchListingsSchema.parse({
        query: "widget",
        sellingType: "digital",
      }),
    ).not.toThrow();
  });
});

describe("ATLAS Marketplace events & permissions", () => {
  it("catalogs marketplace domain events", () => {
    expect(DOMAIN_EVENTS).toContain("marketplace.storefront_created");
    expect(DOMAIN_EVENTS).toContain("marketplace.listing_published");
    expect(DOMAIN_EVENTS).toContain("marketplace.checkout_completed");
    expect(DOMAIN_EVENTS).toContain("marketplace.shipment_created");
  });

  it("maps ecosystem handlers and Pulse ingest", () => {
    expect(MARKETPLACE_EVENT_HANDLERS["business.created"]?.action).toBe(
      "provision",
    );
    expect(MARKETPLACE_EVENT_HANDLERS["product.published"]?.action).toBe(
      "listing",
    );
    expect(PULSE_EVENT_MAP["marketplace.listing_published"]?.itemType).toBe(
      "marketplace_listing",
    );
    expect(PULSE_EVENT_MAP["order.placed"]?.source).toBe("marketplace");
  });

  it("grants merchant listing management", () => {
    const perms = permissionsForPlatformRole("merchant");
    expect(hasPermission(perms, "marketplace:listing:publish")).toBe(true);
    expect(hasPermission(perms, "marketplace:shipment:manage")).toBe(true);
    expect(hasPermission(perms, "marketplace:search")).toBe(true);
  });

  it("grants customer shopping basics", () => {
    const perms = permissionsForPlatformRole("customer");
    expect(hasPermission(perms, "marketplace:cart:manage")).toBe(true);
    expect(hasPermission(perms, "marketplace:checkout:create")).toBe(true);
    expect(hasPermission(perms, "marketplace:wishlist:manage")).toBe(true);
  });
});
