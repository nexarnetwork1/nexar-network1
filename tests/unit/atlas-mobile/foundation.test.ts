import { describe, expect, it } from "vitest";
import {
  MOBILE_APPLICATIONS,
  MOBILE_CONSUMES,
  MOBILE_DASHBOARD_WIDGETS,
  MOBILE_EVENT_HANDLERS,
} from "@/modules/atlas-mobile/types";
import {
  resolveConflict,
  prioritizeOfflineBatch,
  isOfflineCapableScope,
} from "@/modules/atlas-mobile/offline";
import { buildSyncPlan, advanceCursor } from "@/modules/atlas-mobile/sync";
import {
  buildPushPayload,
  pushCategoryForEvent,
} from "@/modules/atlas-mobile/push";
import { parseDeepLink, buildUniversalLink } from "@/modules/atlas-mobile/deep-links";
import { createCameraJobStub, CAMERA_JOB_TYPES } from "@/modules/atlas-mobile/camera";
import {
  registerDeviceSchema,
  enqueueOfflineSchema,
  queuePushSchema,
} from "@/modules/atlas-mobile/validators";
import {
  ownerOf,
  BOUNDED_CONTEXTS,
  DOMAIN_EVENTS,
  hasPermission,
  permissionsForPlatformRole,
  ATLAS_MOBILE_MODULE,
} from "@/domains";
import { ATLAS_ROOT_MODULES } from "@/config/atlas-nav";

describe("ATLAS Mobile bounded context", () => {
  it("registers atlasMobile as mobile platform", () => {
    expect(BOUNDED_CONTEXTS.atlasMobile.id).toBe("atlas_mobile");
    expect(BOUNDED_CONTEXTS.atlasMobile.atlasModule).toBe("mobile");
    expect(BOUNDED_CONTEXTS.atlasMobile.owns).toContain("MobileDevice");
    expect(BOUNDED_CONTEXTS.atlasMobile.owns).toContain("MobileOfflineQueueItem");
  });

  it("never owns Business/Product/Order masters", () => {
    expect(ownerOf("Business")).toBe("businessHub");
    expect(ownerOf("Product")).toBe("businessHub");
    expect(ownerOf("Order")).toBe("orders");
    expect(ownerOf("MobileDevice")).toBe("atlasMobile");
    expect(ownerOf("MobilePushDelivery")).toBe("atlasMobile");
    expect(MOBILE_CONSUMES).toContain("Business");
  });

  it("declares Mobile module as mobile_platform", () => {
    expect(ATLAS_MOBILE_MODULE.role).toBe("mobile_platform");
    expect(ATLAS_MOBILE_MODULE.internalModulePath).toBe("modules/atlas-mobile");
    expect(ATLAS_MOBILE_MODULE.platforms).toContain("ios");
    expect(ATLAS_MOBILE_MODULE.platforms).toContain("android");
  });

  it("maps mobile nav to atlasMobile", () => {
    const m = ATLAS_ROOT_MODULES.find((x) => x.id === "mobile");
    expect(m?.boundedContext).toBe("atlasMobile");
    expect(m?.status).toBe("foundation");
  });

  it("lists mobile applications covering ATLAS pillars", () => {
    expect(MOBILE_APPLICATIONS).toContain("business");
    expect(MOBILE_APPLICATIONS).toContain("marketplace");
    expect(MOBILE_APPLICATIONS).toContain("connect");
    expect(MOBILE_APPLICATIONS).toContain("finance");
    expect(MOBILE_DASHBOARD_WIDGETS).toContain("ai_insights");
  });
});

describe("ATLAS Mobile offline & sync engines", () => {
  it("resolves conflicts with LWW and server_wins", () => {
    const apply = resolveConflict({
      mutation: {
        clientMutationId: "1",
        entityType: "order",
        operation: "update",
        payload: { qty: 2 },
        baseVersion: 1,
      },
      server: null,
    });
    expect(apply.status).toBe("apply");

    const serverWins = resolveConflict({
      mutation: {
        clientMutationId: "2",
        entityType: "order",
        operation: "update",
        payload: { qty: 2 },
        baseVersion: 1,
      },
      server: {
        entityId: "o1",
        version: 2,
        updatedAt: new Date().toISOString(),
        payload: { qty: 1 },
      },
      strategy: "server_wins",
    });
    expect(serverWins.status).toBe("discard");

    const manual = resolveConflict({
      mutation: {
        clientMutationId: "3",
        entityType: "order",
        operation: "update",
        payload: { qty: 2 },
      },
      server: {
        entityId: "o1",
        version: 2,
        updatedAt: new Date().toISOString(),
        payload: { qty: 1 },
      },
      strategy: "manual_merge",
    });
    expect(manual.status).toBe("conflict");
  });

  it("prioritizes offline batches and builds sync plans", () => {
    const batch = prioritizeOfflineBatch([
      {
        clientMutationId: "d",
        entityType: "x",
        operation: "delete",
        payload: {},
      },
      {
        clientMutationId: "c",
        entityType: "x",
        operation: "create",
        payload: {},
      },
    ]);
    expect(batch[0].operation).toBe("create");
    expect(isOfflineCapableScope("orders")).toBe(true);

    const plan = buildSyncPlan({ offlinePro: true, includeRealtime: true });
    expect(plan.pull).toContain("finance");
    expect(plan.realtimeChannels.length).toBeGreaterThan(0);
    expect(advanceCursor("5")).toBe("6");
  });
});

describe("ATLAS Mobile push, deep links, camera", () => {
  it("builds push payloads and maps events", () => {
    const payload = buildPushPayload({
      category: "payment",
      title: "Paid",
    });
    expect(payload.priority).toBe("high");
    expect(pushCategoryForEvent("order.paid")).toBe("marketplace_order");
    expect(pushCategoryForEvent("ai.insight_generated")).toBe("ai_insight");
  });

  it("parses deep links and universal links", () => {
    const match = parseDeepLink("atlas://orders/abc-123");
    expect(match?.targetModule).toBe("marketplace");
    expect(match?.params.id).toBe("abc-123");
    expect(buildUniversalLink("/wallet")).toContain("/wallet");
  });

  it("exposes camera/OCR stubs", () => {
    expect(CAMERA_JOB_TYPES).toContain("receipt");
    const stub = createCameraJobStub({ jobType: "qr" });
    expect(stub.status).toBe("stub");
  });
});

describe("ATLAS Mobile validators, events, permissions", () => {
  it("validates device and offline inputs", () => {
    expect(() =>
      registerDeviceSchema.parse({
        userId: "00000000-0000-4000-8000-000000000001",
        deviceFingerprint: "device-fingerprint-1",
        platform: "ios",
      }),
    ).not.toThrow();

    expect(() =>
      enqueueOfflineSchema.parse({
        deviceId: "00000000-0000-4000-8000-000000000002",
        userId: "00000000-0000-4000-8000-000000000001",
        clientMutationId: "m1",
        scope: "orders",
        entityType: "order_draft",
        operation: "create",
        payload: { total: 10 },
      }),
    ).not.toThrow();

    expect(() =>
      queuePushSchema.parse({
        userId: "00000000-0000-4000-8000-000000000001",
        category: "message",
        title: "Hello",
      }),
    ).not.toThrow();
  });

  it("catalogs mobile domain events", () => {
    expect(DOMAIN_EVENTS).toContain("mobile.device_registered");
    expect(DOMAIN_EVENTS).toContain("mobile.push_queued");
    expect(DOMAIN_EVENTS).toContain("mobile.sync_completed");
    expect(DOMAIN_EVENTS).toContain("mobile.sync_conflict");
  });

  it("registers push fan-out handlers", () => {
    expect(MOBILE_EVENT_HANDLERS["order.paid"].action).toBe("push");
    expect(MOBILE_EVENT_HANDLERS["payment.confirmed"]).toBeDefined();
  });

  it("grants mobile permissions to customer and merchant", () => {
    expect(
      hasPermission(permissionsForPlatformRole("customer"), "mobile:device:register"),
    ).toBe(true);
    expect(
      hasPermission(permissionsForPlatformRole("merchant"), "mobile:remote:logout"),
    ).toBe(true);
  });
});
