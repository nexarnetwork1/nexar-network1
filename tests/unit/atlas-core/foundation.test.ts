import { describe, expect, it } from "vitest";
import {
  CORE_WORKFLOWS,
  CORE_CONNECTED_MODULES,
  NOTIFICATION_HUB_EVENTS,
  SEARCH_INDEX_EVENTS,
  workflowForEvent,
} from "@/modules/atlas-core/types";
import {
  planWorkflow,
  listOrchestratedTriggers,
  connectedModuleCount,
  markStepsCompleted,
} from "@/modules/atlas-core/workflows";
import { resolveChannels, buildHubResult } from "@/modules/atlas-core/notification-hub";
import {
  buildSearchDocumentFromEvent,
  matchSearchQuery,
} from "@/modules/atlas-core/search-index";
import {
  ownerOf,
  BOUNDED_CONTEXTS,
  ATLAS_CORE_MODULE,
  resolvePermissions,
  hasPermission,
} from "@/domains";
import { ATLAS_ROOT_MODULES } from "@/config/atlas-nav";

describe("ATLAS Core bounded context", () => {
  it("registers atlasCore as integration spine", () => {
    expect(BOUNDED_CONTEXTS.atlasCore.id).toBe("atlas_core");
    expect(BOUNDED_CONTEXTS.atlasCore.owns).toContain("CoreOutboxMessage");
    expect(BOUNDED_CONTEXTS.atlasCore.owns).toContain("CoreTimelineEvent");
    expect(ownerOf("CoreSearchDocument")).toBe("atlasCore");
    expect(ownerOf("OutboxMessage")).toBe("atlasCore");
  });

  it("never owns Business/Product/Order", () => {
    expect(ownerOf("Business")).toBe("businessHub");
    expect(ownerOf("Product")).toBe("businessHub");
    expect(ownerOf("Order")).toBe("orders");
  });

  it("declares Core module as integration_spine", () => {
    expect(ATLAS_CORE_MODULE.role).toBe("integration_spine");
    expect(ATLAS_CORE_MODULE.integrates).toContain("marketplace");
    expect(ATLAS_CORE_MODULE.integrates).toContain("finance");
  });

  it("maps core nav", () => {
    const m = ATLAS_ROOT_MODULES.find((x) => x.id === "core");
    expect(m?.boundedContext).toBe("atlasCore");
  });
});

describe("ATLAS Core workflows", () => {
  it("plans product_published and order_paid workflows", () => {
    const product = planWorkflow("product.published");
    expect(product?.workflow.key).toBe("product_published");
    expect(product?.steps.some((s) => s.module === "marketplace")).toBe(true);
    expect(product?.steps.some((s) => s.module === "search")).toBe(true);

    const order = planWorkflow("order.paid");
    expect(order?.workflow.key).toBe("order_paid");
    expect(order?.steps.some((s) => s.module === "finance")).toBe(true);
    expect(order?.steps.some((s) => s.module === "nxr")).toBe(true);

    expect(workflowForEvent("business.created")?.key).toBe("business_created");
    expect(listOrchestratedTriggers()).toContain("product.published");
    expect(connectedModuleCount()).toBeGreaterThan(8);
    expect(markStepsCompleted(product!.steps)[0].status).toBe("completed");
  });

  it("lists connected modules covering the OS", () => {
    expect(CORE_CONNECTED_MODULES).toContain("business");
    expect(CORE_CONNECTED_MODULES).toContain("ai");
    expect(CORE_CONNECTED_MODULES).toContain("notifications");
    expect(CORE_WORKFLOWS.length).toBeGreaterThanOrEqual(5);
  });
});

describe("ATLAS Core notification hub & search", () => {
  it("resolves channels and skips sms/webhook until configured", () => {
    expect(resolveChannels(["in_app", "sms", "webhook"])).toEqual(["in_app"]);
    const result = buildHubResult(["in_app", "email"], ["in_app"]);
    expect(result.queued).toEqual(["in_app"]);
    expect(result.skipped).toEqual(["email"]);
    expect(NOTIFICATION_HUB_EVENTS["order.paid"]).toBeDefined();
  });

  it("builds search documents from events", () => {
    const doc = buildSearchDocumentFromEvent({
      entityType: "product",
      entityId: "p1",
      businessId: "b1",
      payload: { title: "Widget", description: "Nice" },
      titleKey: "title",
    });
    expect(doc?.title).toBe("Widget");
    expect(SEARCH_INDEX_EVENTS["product.published"]).toBeDefined();
    expect(
      matchSearchQuery([{ title: "Acme", body: "corp" }], "acme"),
    ).toHaveLength(1);
  });
});

describe("ATLAS Core permissions SoT", () => {
  it("keeps single permission resolution path", () => {
    const perms = resolvePermissions({ platformRole: "merchant" });
    expect(hasPermission(perms, "business:read")).toBe(true);
    expect(hasPermission(perms, "finance:journal:post")).toBe(true);
  });
});
