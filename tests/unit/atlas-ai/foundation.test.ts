import { describe, expect, it } from "vitest";
import {
  DEFAULT_AI_AGENTS,
  AI_EVENT_HANDLERS,
  BUSINESS_CONTEXT_MODULES,
  ORDER_CREATED_WORKFLOW_STEPS,
} from "@/modules/atlas-ai/types";
import {
  selectAgentForCapability,
  AGENT_CAPABILITY_ROUTING,
  agentCanUseTool,
} from "@/modules/atlas-ai/agents";
import {
  stubEmbed,
  cosineSimilarity,
  rankBySimilarity,
} from "@/modules/atlas-ai/vector";
import {
  ORDER_CREATED_PIPELINE,
  planWorkflowExecution,
  describeAutomationPacks,
  workflowSlugForEvent,
} from "@/modules/atlas-ai/workflows";
import {
  scoreMemoryRelevance,
  mergeMemoryCandidates,
} from "@/modules/atlas-ai/memory";
import {
  runCapabilitySchema,
  semanticSearchSchema,
  ensureWorkspaceSchema,
} from "@/modules/atlas-ai/validators";
import {
  ownerOf,
  BOUNDED_CONTEXTS,
  DOMAIN_EVENTS,
  hasPermission,
  permissionsForPlatformRole,
  ATLAS_AI_MODULE,
} from "@/domains";
import { ATLAS_ROOT_MODULES } from "@/config/atlas-nav";

describe("ATLAS AI bounded context", () => {
  it("registers atlasAi as active context", () => {
    expect(BOUNDED_CONTEXTS.atlasAi.id).toBe("atlas_ai");
    expect(BOUNDED_CONTEXTS.atlasAi.atlasModule).toBe("ai");
    expect(BOUNDED_CONTEXTS.atlasAi.owns).toContain("AiWorkspace");
    expect(BOUNDED_CONTEXTS.atlasAi.owns).toContain("AiAgent");
    expect(BOUNDED_CONTEXTS.atlasAi.owns).toContain("AiWorkflow");
  });

  it("owns intelligence aggregates — not Business masters", () => {
    expect(ownerOf("AiWorkspace")).toBe("atlasAi");
    expect(ownerOf("AiMemory")).toBe("atlasAi");
    expect(ownerOf("AiInsight")).toBe("atlasAi");
    expect(ownerOf("Business")).toBe("businessHub");
    expect(ownerOf("Product")).toBe("businessHub");
    expect(ownerOf("ConnectWorkspace")).toBe("atlasConnect");
  });

  it("declares AI module metadata", () => {
    expect(ATLAS_AI_MODULE.publicName).toBe("AI");
    expect(ATLAS_AI_MODULE.internalModulePath).toBe("modules/atlas-ai");
    expect(ATLAS_AI_MODULE.dbNamespace).toBe("atlas_ai");
  });

  it("maps ai nav to atlasAi", () => {
    const ai = ATLAS_ROOT_MODULES.find((m) => m.id === "ai");
    expect(ai?.label).toBe("AI");
    expect(ai?.boundedContext).toBe("atlasAi");
    expect(ai?.status).toBe("foundation");
  });

  it("provisions eleven system agents", () => {
    expect(DEFAULT_AI_AGENTS).toHaveLength(11);
    expect(DEFAULT_AI_AGENTS.map((a) => a.slug)).toEqual(
      expect.arrayContaining([
        "ceo",
        "sales",
        "finance",
        "analytics",
        "developer",
      ]),
    );
  });

  it("declares business context modules across ATLAS", () => {
    expect(BUSINESS_CONTEXT_MODULES).toContain("connect");
    expect(BUSINESS_CONTEXT_MODULES).toContain("pulse");
    expect(BUSINESS_CONTEXT_MODULES).toContain("marketplace");
  });
});

describe("ATLAS AI agents & workflows", () => {
  it("routes capabilities to preferred agents", () => {
    expect(selectAgentForCapability("forecast")).toBe("finance");
    expect(selectAgentForCapability("automate")).toBe("operations");
    expect(AGENT_CAPABILITY_ROUTING.analyze).toContain("analytics");
  });

  it("scopes tools per agent role", () => {
    expect(agentCanUseTool("finance", "wallet")).toBe(true);
    expect(agentCanUseTool("legal", "marketplace")).toBe(false);
  });

  it("plans order-created pipeline steps", () => {
    expect(ORDER_CREATED_WORKFLOW_STEPS).toHaveLength(6);
    expect(ORDER_CREATED_PIPELINE[0].action).toBe("notify_team");
    expect(ORDER_CREATED_PIPELINE[5].action).toBe("schedule_follow_up");
    const planned = planWorkflowExecution(ORDER_CREATED_PIPELINE, {
      orderId: "o1",
    });
    expect(planned).toHaveLength(6);
    expect(planned[1].params.orderId).toBe("o1");
  });

  it("maps order events to workflow slug", () => {
    expect(workflowSlugForEvent("order.placed")).toBe("order-created");
    expect(workflowSlugForEvent("order.paid")).toBe("order-created");
    expect(workflowSlugForEvent("invoice.issued")).toBeNull();
  });

  it("lists monetization automation packs", () => {
    const packs = describeAutomationPacks();
    expect(packs.map((p) => p.feature)).toContain("ai_credits");
    expect(packs.map((p) => p.feature)).toContain("custom_agents");
  });
});

describe("ATLAS AI memory & vector", () => {
  it("embeds and ranks by cosine similarity", () => {
    const a = stubEmbed("invoice payment revenue");
    const b = stubEmbed("invoice payment revenue");
    const c = stubEmbed("unrelated gardening tips");
    expect(cosineSimilarity(a, b)).toBeGreaterThan(cosineSimilarity(a, c));

    const ranked = rankBySimilarity(a, [
      { id: "1", content: "invoice payment revenue", embedding: b },
      { id: "2", content: "unrelated gardening tips", embedding: c },
    ]);
    expect(ranked[0].id).toBe("1");
  });

  it("scores and merges memories", () => {
    const memories = [
      {
        id: "1",
        workspace_id: "w",
        scope: "business" as const,
        user_id: null,
        conversation_id: null,
        key: "revenue",
        content: "Q1 revenue grew 20%",
        importance: 0.5,
        expires_at: null,
        metadata: {},
        created_at: "",
        updated_at: "",
      },
      {
        id: "2",
        workspace_id: "w",
        scope: "user" as const,
        user_id: "u",
        conversation_id: null,
        key: "pref",
        content: "Prefers concise reports",
        importance: 0.3,
        expires_at: null,
        metadata: {},
        created_at: "",
        updated_at: "",
      },
    ];
    expect(scoreMemoryRelevance(memories[0], "revenue")).toBeGreaterThan(0.5);
    expect(mergeMemoryCandidates(memories, "revenue", 1)[0].id).toBe("1");
  });
});

describe("ATLAS AI validators", () => {
  it("validates workspace and capability inputs", () => {
    expect(() =>
      ensureWorkspaceSchema.parse({
        businessId: "00000000-0000-4000-8000-000000000001",
        ownerUserId: "00000000-0000-4000-8000-000000000002",
        displayName: "Acme",
        slug: "acme",
      }),
    ).not.toThrow();

    expect(() =>
      runCapabilitySchema.parse({
        workspaceId: "00000000-0000-4000-8000-000000000001",
        capability: "summarize",
        userId: "00000000-0000-4000-8000-000000000002",
        prompt: "Summarize Q1",
      }),
    ).not.toThrow();

    expect(() =>
      semanticSearchSchema.parse({
        workspaceId: "00000000-0000-4000-8000-000000000001",
        query: "contracts",
      }),
    ).not.toThrow();
  });
});

describe("ATLAS AI events & permissions", () => {
  it("catalogs ai domain events", () => {
    expect(DOMAIN_EVENTS).toContain("ai.workspace_created");
    expect(DOMAIN_EVENTS).toContain("ai.insight_generated");
    expect(DOMAIN_EVENTS).toContain("ai.workflow_executed");
    expect(DOMAIN_EVENTS).toContain("ai.prediction_generated");
    expect(DOMAIN_EVENTS).toContain("ai.automation_executed");
  });

  it("maps ecosystem events to AI handlers", () => {
    expect(AI_EVENT_HANDLERS["business.created"]?.action).toBe("provision");
    expect(AI_EVENT_HANDLERS["order.placed"]?.action).toBe("workflow");
    expect(AI_EVENT_HANDLERS["product.published"]).toBeDefined();
  });

  it("grants business role full AI management", () => {
    const perms = permissionsForPlatformRole("business");
    expect(hasPermission(perms, "ai:workspace:manage")).toBe(true);
    expect(hasPermission(perms, "ai:workflow:execute")).toBe(true);
    expect(hasPermission(perms, "ai:agent:manage")).toBe(true);
    expect(hasPermission(perms, "ai:credits:use")).toBe(true);
  });

  it("grants merchant AI collaboration basics", () => {
    const perms = permissionsForPlatformRole("merchant");
    expect(hasPermission(perms, "ai:agent:use")).toBe(true);
    expect(hasPermission(perms, "ai:insight:read")).toBe(true);
    expect(hasPermission(perms, "ai:search")).toBe(true);
  });
});
