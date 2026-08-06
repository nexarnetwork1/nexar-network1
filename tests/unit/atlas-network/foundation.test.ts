import { describe, expect, it } from "vitest";
import {
  ownerOf,
  BOUNDED_CONTEXTS,
  DOMAIN_EVENTS,
  hasPermission,
  permissionsForPlatformRole,
  ATLAS_NETWORK_MODULE,
} from "@/domains";
import { ATLAS_ROOT_MODULES } from "@/config/atlas-nav";

describe("ATLAS Network bounded context", () => {
  it("registers atlasNetwork as active context", () => {
    expect(BOUNDED_CONTEXTS.atlasNetwork.id).toBe("atlas_network");
    expect(BOUNDED_CONTEXTS.atlasNetwork.atlasModule).toBe("network");
    expect(BOUNDED_CONTEXTS.atlasNetwork.owns).toContain("Profile");
    expect(BOUNDED_CONTEXTS.atlasNetwork.owns).toContain("Post");
    expect(BOUNDED_CONTEXTS.atlasNetwork.owns).toContain("Conversation");
  });

  it("owns social graph aggregates — not Business masters", () => {
    expect(ownerOf("Profile")).toBe("atlasNetwork");
    expect(ownerOf("Post")).toBe("atlasNetwork");
    expect(ownerOf("Connection")).toBe("atlasNetwork");
    expect(ownerOf("Page")).toBe("atlasNetwork");
    expect(ownerOf("Business")).toBe("businessHub");
    expect(ownerOf("Product")).toBe("businessHub");
    expect(ownerOf("Listing")).toBe("marketplace");
  });

  it("declares network module metadata", () => {
    expect(ATLAS_NETWORK_MODULE.publicName).toBe("Network");
    expect(ATLAS_NETWORK_MODULE.internalModulePath).toBe("modules/atlas-network");
    expect(ATLAS_NETWORK_MODULE.consumes).toContain("Business");
  });

  it("includes network in ATLAS root modules as foundation", () => {
    const network = ATLAS_ROOT_MODULES.find((m) => m.id === "network");
    expect(network?.status).toBe("foundation");
    expect(network?.boundedContext).toBe("atlasNetwork");
  });
});

describe("ATLAS Network domain events", () => {
  it("catalogs network events", () => {
    expect(DOMAIN_EVENTS).toContain("network.profile_created");
    expect(DOMAIN_EVENTS).toContain("network.company_profile_created");
    expect(DOMAIN_EVENTS).toContain("network.post_created");
    expect(DOMAIN_EVENTS).toContain("network.connection_accepted");
  });
});

describe("ATLAS Network permissions", () => {
  it("grants business role network publishing capabilities", () => {
    const perms = permissionsForPlatformRole("business");
    expect(hasPermission(perms, "network:post:create")).toBe(true);
    expect(hasPermission(perms, "network:page:manage")).toBe(true);
    expect(hasPermission(perms, "network:message:send")).toBe(true);
  });

  it("grants customers read and follow", () => {
    const perms = permissionsForPlatformRole("customer");
    expect(hasPermission(perms, "network:profile:read")).toBe(true);
    expect(hasPermission(perms, "network:follow")).toBe(true);
    expect(hasPermission(perms, "network:post:create")).toBe(false);
  });
});
