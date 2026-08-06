import { describe, expect, it } from "vitest";
import {
  suggestMessageActions,
  primaryActionForMessageType,
} from "@/modules/atlas-connect/actions";
import {
  workspaceChannel,
  conversationChannel,
  meetingChannel,
  subscriptionsForWorkspace,
  buildRealtimePayload,
} from "@/modules/atlas-connect/realtime";
import {
  DEFAULT_CONNECT_CHANNELS,
  CONNECT_EVENT_HANDLERS,
} from "@/modules/atlas-connect/types";
import {
  CONNECT_AI_CAPABILITIES,
  createConnectAiStubResult,
  recommendNextActionsFromMessage,
} from "@/modules/atlas-connect/ai";
import {
  CONNECT_SEARCH_SCOPES,
  rankSearchHits,
  scoreTextMatch,
  tokenizeSearchQuery,
} from "@/modules/atlas-connect/search";
import {
  resolveDeliveryChannels,
  buildNotificationEnvelope,
  DEFAULT_CONNECT_NOTIFICATION_PREFS,
} from "@/modules/atlas-connect/notifications";
import {
  assessMessageSpam,
  encryptionReadyDefaults,
  isAttachmentSafeToShare,
} from "@/modules/atlas-connect/security";
import {
  sendMessageSchema,
  createChannelSchema,
  searchConnectSchema,
} from "@/modules/atlas-connect/validators";
import {
  ownerOf,
  BOUNDED_CONTEXTS,
  DOMAIN_EVENTS,
  hasPermission,
  permissionsForPlatformRole,
  ATLAS_CONNECT_MODULE,
} from "@/domains";
import { ATLAS_ROOT_MODULES } from "@/config/atlas-nav";

describe("ATLAS Connect bounded context", () => {
  it("registers atlasConnect as active context", () => {
    expect(BOUNDED_CONTEXTS.atlasConnect.id).toBe("atlas_connect");
    expect(BOUNDED_CONTEXTS.atlasConnect.atlasModule).toBe("connect");
    expect(BOUNDED_CONTEXTS.atlasConnect.owns).toContain("ConnectWorkspace");
    expect(BOUNDED_CONTEXTS.atlasConnect.owns).toContain("ConnectMessage");
    expect(BOUNDED_CONTEXTS.atlasConnect.owns).toContain("ConnectNotificationPrefs");
    expect(BOUNDED_CONTEXTS.atlasConnect.owns).toContain("ConnectDeviceSession");
  });

  it("owns collaboration aggregates — not Network social Conversation", () => {
    expect(ownerOf("ConnectWorkspace")).toBe("atlasConnect");
    expect(ownerOf("ConnectTask")).toBe("atlasConnect");
    expect(ownerOf("ConnectMeeting")).toBe("atlasConnect");
    expect(ownerOf("ConnectDeviceSession")).toBe("atlasConnect");
    expect(ownerOf("Conversation")).toBe("atlasNetwork");
    expect(ownerOf("Product")).toBe("businessHub");
  });

  it("declares Connect module metadata", () => {
    expect(ATLAS_CONNECT_MODULE.publicName).toBe("Connect");
    expect(ATLAS_CONNECT_MODULE.internalModulePath).toBe("modules/atlas-connect");
    expect(ATLAS_CONNECT_MODULE.dbNamespace).toBe("atlas_connect");
  });

  it("maps connect nav to atlasConnect", () => {
    const connect = ATLAS_ROOT_MODULES.find((m) => m.id === "connect");
    expect(connect?.label).toBe("Connect");
    expect(connect?.boundedContext).toBe("atlasConnect");
    expect(ATLAS_ROOT_MODULES.find((m) => m.id === "chat")).toBeUndefined();
  });

  it("provisions seven default collaboration channels", () => {
    const slugs = DEFAULT_CONNECT_CHANNELS.map((c) => c.slug);
    expect(slugs).toEqual(
      expect.arrayContaining([
        "general",
        "announcements",
        "sales",
        "support",
        "finance",
        "hr",
        "marketplace",
      ]),
    );
    expect(DEFAULT_CONNECT_CHANNELS).toHaveLength(7);
  });
});

describe("ATLAS Connect smart actions", () => {
  it("suggests task conversion for todo keywords", () => {
    const suggestions = suggestMessageActions({
      messageType: "text",
      body: "Please follow up on this action item tomorrow",
      payload: {},
    });
    const task = suggestions.find((s) => s.actionType === "task");
    expect(task).toBeDefined();
    expect(task!.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("maps quotation to CRM opportunity as primary action", () => {
    expect(primaryActionForMessageType("quotation")).toBe("crm_opportunity");
    expect(primaryActionForMessageType("task")).toBe("task");
    expect(primaryActionForMessageType("text")).toBeNull();
  });

  it("ranks suggestions by confidence", () => {
    const suggestions = suggestMessageActions({
      messageType: "text",
      body: "Lead inquiry from a prospect interested in our offer",
      payload: {},
    });
    expect(suggestions[0].confidence).toBeGreaterThanOrEqual(
      suggestions[suggestions.length - 1]?.confidence ?? 0,
    );
  });
});

describe("ATLAS Connect AI / search / notifications / security", () => {
  it("lists AI capabilities", () => {
    expect(CONNECT_AI_CAPABILITIES).toContain("conversation_summary");
    expect(CONNECT_AI_CAPABILITIES).toContain("generate_invoice");
    expect(
      createConnectAiStubResult({
        capability: "meeting_summary",
        workspaceId: "00000000-0000-4000-8000-000000000001",
      }).metadata.status,
    ).toBe("not_implemented");
  });

  it("recommends next actions from quotation messages", () => {
    const actions = recommendNextActionsFromMessage({ messageType: "quotation" });
    expect(actions[0]?.action).toMatch(/order/i);
  });

  it("ranks search hits and tokenizes queries", () => {
    expect(tokenizeSearchQuery("Invoice #42")).toContain("invoice");
    expect(scoreTextMatch("Payment invoice due", "invoice")).toBeGreaterThan(0);
    const ranked = rankSearchHits([
      {
        scope: "messages",
        entityId: "a",
        title: "low",
        snippet: null,
        score: 0.2,
        workspaceId: "w",
      },
      {
        scope: "files",
        entityId: "b",
        title: "high",
        snippet: null,
        score: 0.9,
        workspaceId: "w",
      },
    ]);
    expect(ranked[0].entityId).toBe("b");
    expect(CONNECT_SEARCH_SCOPES).toContain("customers");
  });

  it("filters notification channels by prefs", () => {
    const channels = resolveDeliveryChannels(
      { ...DEFAULT_CONNECT_NOTIFICATION_PREFS, emailEnabled: false },
      ["realtime", "email", "mention"],
      "mention",
    );
    expect(channels).toContain("realtime");
    expect(channels).toContain("mention");
    expect(channels).not.toContain("email");

    const envelope = buildNotificationEnvelope({
      kind: "task",
      workspaceId: "w",
      userId: "u",
      title: "New task",
      body: "Follow up",
    });
    expect(envelope.priority).toBe("normal");
  });

  it("assesses spam and encryption defaults", () => {
    const spam = assessMessageSpam({
      messageBody: "Double your crypto airdrop click here now https://a https://b https://c",
      senderUserId: null,
      linkCount: 3,
    });
    expect(spam.isSpam).toBe(true);
    expect(encryptionReadyDefaults().isEncrypted).toBe(false);
    expect(isAttachmentSafeToShare("clean")).toBe(true);
    expect(isAttachmentSafeToShare("infected")).toBe(false);
  });
});

describe("ATLAS Connect validators", () => {
  it("validates send message input", () => {
    expect(() =>
      sendMessageSchema.parse({
        conversationId: "00000000-0000-4000-8000-000000000001",
        senderUserId: "00000000-0000-4000-8000-000000000002",
        messageType: "text",
        body: "Hello",
      }),
    ).not.toThrow();

    expect(() =>
      sendMessageSchema.parse({
        conversationId: "00000000-0000-4000-8000-000000000001",
        senderUserId: "00000000-0000-4000-8000-000000000002",
        messageType: "text",
        body: "",
      }),
    ).toThrow();
  });

  it("validates channel and search schemas", () => {
    expect(() =>
      createChannelSchema.parse({
        workspaceId: "00000000-0000-4000-8000-000000000001",
        channelType: "projects",
        name: "Alpha",
        slug: "alpha",
        createdBy: "00000000-0000-4000-8000-000000000002",
      }),
    ).not.toThrow();

    expect(() =>
      searchConnectSchema.parse({
        workspaceId: "00000000-0000-4000-8000-000000000001",
        query: "invoice",
        scopes: ["messages", "files"],
      }),
    ).not.toThrow();
  });
});

describe("ATLAS Connect realtime contracts", () => {
  it("builds typed channel names", () => {
    expect(workspaceChannel("abc")).toBe("connect:workspace:abc");
    expect(conversationChannel("xyz")).toBe("connect:conversation:xyz");
    expect(meetingChannel("m1")).toBe("connect:meeting:m1");
  });

  it("lists subscriptions for workspace entry", () => {
    const subs = subscriptionsForWorkspace("w1", "u1", ["c1", "c2"]);
    expect(subs).toContain("connect:workspace:w1");
    expect(subs).toContain("connect:user:u1");
    expect(subs).toContain("connect:conversation:c1");
    expect(subs).toContain("connect:presence:w1");
  });

  it("builds realtime payload envelope", () => {
    const payload = buildRealtimePayload({
      event: "message.sent",
      conversationId: "c1",
      messageId: "m1",
      userId: "u1",
    });
    expect(payload.event).toBe("message.sent");
    expect(payload.occurredAt).toBeTruthy();
  });
});

describe("ATLAS Connect events & permissions", () => {
  it("catalogs connect domain events", () => {
    expect(DOMAIN_EVENTS).toContain("connect.workspace_created");
    expect(DOMAIN_EVENTS).toContain("connect.channel_created");
    expect(DOMAIN_EVENTS).toContain("connect.message_sent");
    expect(DOMAIN_EVENTS).toContain("connect.task_created");
    expect(DOMAIN_EVENTS).toContain("connect.meeting_scheduled");
    expect(DOMAIN_EVENTS).toContain("connect.meeting_started");
    expect(DOMAIN_EVENTS).toContain("connect.meeting_ended");
    expect(DOMAIN_EVENTS).toContain("connect.order_shared");
    expect(DOMAIN_EVENTS).toContain("connect.payment_requested");
  });

  it("maps ecosystem events to connect handlers", () => {
    expect(CONNECT_EVENT_HANDLERS["business.created"]?.action).toBe("provision");
    expect(CONNECT_EVENT_HANDLERS["order.paid"]).toBeDefined();
    expect(CONNECT_EVENT_HANDLERS["invoice.issued"]).toBeDefined();
    expect(CONNECT_EVENT_HANDLERS["partner.accepted"]).toBeDefined();
  });

  it("grants business role connect management", () => {
    const perms = permissionsForPlatformRole("business");
    expect(hasPermission(perms, "connect:workspace:manage")).toBe(true);
    expect(hasPermission(perms, "connect:action:convert")).toBe(true);
    expect(hasPermission(perms, "connect:meeting:schedule")).toBe(true);
    expect(hasPermission(perms, "connect:search")).toBe(true);
  });

  it("grants merchant collaboration basics", () => {
    const perms = permissionsForPlatformRole("merchant");
    expect(hasPermission(perms, "connect:message:send")).toBe(true);
    expect(hasPermission(perms, "connect:task:create")).toBe(true);
  });
});
