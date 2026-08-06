import "server-only";

import { randomUUID } from "node:crypto";
import { publishDomainEvent, type DomainEvent } from "@/domains";
import type {
  AtlasAiPort,
  AiWorkspaceRecord,
  AiAgentRecord,
  AiConversationRecord,
  AiInsightRecord,
} from "@/domains/contracts/ports";
import { selectAgentForCapability } from "./agents";
import { mergeMemoryCandidates } from "./memory";
import {
  adjustCredits,
  createConversationRecord,
  createExecutionRecord,
  createInsightRecord,
  createMessageRecord,
  createPredictionRecord,
  createRecommendationRecord,
  createReportRecord,
  createTaskRecord,
  ensureBusinessAiWorkspace,
  getAgentBySlug,
  getAgentsByWorkspace,
  getBusinessContext,
  getConversationsByWorkspace,
  getMessagesByConversation,
  getWorkflowBySlug,
  getWorkspaceByBusinessId,
  getWorkspaceById,
  indexKnowledgeItem,
  listMemories,
  listVectorDocuments,
  searchKnowledgeLexical,
  updateExecutionStatus,
  writeMemoryRecord,
} from "./repository";
import type {
  AiCapability,
  AiInsightKind,
  AiWorkspace,
  CreateAiConversationInput,
  EnsureAiWorkspaceInput,
  IndexKnowledgeInput,
  RunCapabilityInput,
} from "./types";
import {
  createConversationSchema,
  ensureWorkspaceSchema,
  executeWorkflowSchema,
  indexKnowledgeSchema,
  runCapabilitySchema,
  semanticSearchSchema,
  writeMemorySchema,
} from "./validators";
import { stubEmbed, rankBySimilarity } from "./vector";
import {
  ORDER_CREATED_PIPELINE,
  planWorkflowExecution,
  workflowSlugForEvent,
} from "./workflows";

async function emit(
  name: DomainEvent["name"],
  input: {
    actorId: string | null;
    businessId: string | null;
    payload: Record<string, unknown>;
  },
) {
  await publishDomainEvent({
    id: randomUUID(),
    name,
    occurredAt: new Date(),
    actorId: input.actorId,
    businessId: input.businessId,
    payload: input.payload,
    correlationId: randomUUID(),
  });
}

function toWorkspaceRecord(ws: AiWorkspace): AiWorkspaceRecord {
  return {
    id: ws.id,
    businessId: ws.business_id,
    name: ws.name,
    slug: ws.slug,
    monetizationPlan: ws.monetization_plan,
    creditsBalance: ws.ai_credits_balance,
  };
}

export async function ensureBusinessAi(
  input: EnsureAiWorkspaceInput,
): Promise<AiWorkspaceRecord> {
  ensureWorkspaceSchema.parse(input);
  const existing = await getWorkspaceByBusinessId(input.businessId);
  const workspace = await ensureBusinessAiWorkspace(input);

  if (!existing) {
    await emit("ai.workspace_created", {
      actorId: input.ownerUserId,
      businessId: input.businessId,
      payload: { workspaceId: workspace.id, slug: workspace.slug },
    });
  }

  return toWorkspaceRecord(workspace);
}

export async function getBusinessAiWorkspace(
  businessId: string,
): Promise<AiWorkspaceRecord | null> {
  const ws = await getWorkspaceByBusinessId(businessId);
  return ws ? toWorkspaceRecord(ws) : null;
}

export async function listAgents(workspaceId: string): Promise<AiAgentRecord[]> {
  const agents = await getAgentsByWorkspace(workspaceId);
  return agents.map((a) => ({
    id: a.id,
    workspaceId: a.workspace_id,
    role: a.agent_role,
    name: a.name,
    slug: a.slug,
    capabilities: a.capabilities,
  }));
}

export async function startConversation(
  input: CreateAiConversationInput,
): Promise<AiConversationRecord> {
  createConversationSchema.parse(input);
  const conversation = await createConversationRecord(input);

  await emit("ai.conversation_created", {
    actorId: input.userId,
    businessId: null,
    payload: {
      conversationId: conversation.id,
      workspaceId: input.workspaceId,
      agentId: input.agentId ?? null,
    },
  });

  return {
    id: conversation.id,
    workspaceId: conversation.workspace_id,
    agentId: conversation.agent_id,
    userId: conversation.user_id,
    title: conversation.title,
    messageCount: conversation.message_count,
  };
}

export async function sendAiMessage(input: {
  conversationId: string;
  workspaceId: string;
  userId: string;
  content: string;
  agentSlug?: string;
}): Promise<{ userMessageId: string; assistantMessageId: string }> {
  const userMsg = await createMessageRecord({
    conversationId: input.conversationId,
    role: "user",
    content: input.content,
  });

  const role = input.agentSlug
    ? input.agentSlug
    : selectAgentForCapability("summarize");
  const agent = await getAgentBySlug(
    input.workspaceId,
    typeof role === "string" ? role : "ceo",
  );

  const stubReply = [
    `[ATLAS AI · ${agent?.name ?? "CEO Agent"}]`,
    "Provider-agnostic stub response — wire an LLM provider to replace this.",
    `Understood: ${input.content.slice(0, 280)}`,
  ].join("\n");

  const assistantMsg = await createMessageRecord({
    conversationId: input.conversationId,
    role: "assistant",
    content: stubReply,
    toolPayload: { agentId: agent?.id ?? null, stub: true },
  });

  await writeMemoryRecord({
    workspaceId: input.workspaceId,
    scope: "conversation",
    key: `conv:${input.conversationId}:last`,
    content: input.content,
    userId: input.userId,
    conversationId: input.conversationId,
    importance: 0.4,
  });

  return {
    userMessageId: userMsg.id,
    assistantMessageId: assistantMsg.id,
  };
}

export async function runCapability(input: RunCapabilityInput): Promise<{
  taskId: string;
  executionId: string;
  stubOutput: string;
}> {
  runCapabilitySchema.parse(input);
  const preferredRole = input.agentSlug
    ? input.agentSlug
    : selectAgentForCapability(input.capability);
  const agent = await getAgentBySlug(input.workspaceId, preferredRole);

  const task = await createTaskRecord({
    workspaceId: input.workspaceId,
    title: `AI · ${input.capability}`,
    description: input.prompt.slice(0, 500),
    capability: input.capability,
    agentId: agent?.id,
    createdBy: input.userId,
    result: { status: "stub" },
  });

  await emit("ai.task_created", {
    actorId: input.userId,
    businessId: null,
    payload: { taskId: task.id, capability: input.capability },
  });

  const execution = await createExecutionRecord({
    workspaceId: input.workspaceId,
    status: "running",
    input: { capability: input.capability, prompt: input.prompt, context: input.context },
  });

  const stubOutput = renderCapabilityStub(input.capability, input.prompt, input.context);
  await updateExecutionStatus(execution.id, "succeeded", { stubOutput });
  await adjustCredits(input.workspaceId, -1, `capability:${input.capability}`, execution.id);

  return { taskId: task.id, executionId: execution.id, stubOutput };
}

function renderCapabilityStub(
  capability: AiCapability,
  prompt: string,
  context?: Record<string, unknown>,
): string {
  const ctx = context ? JSON.stringify(context).slice(0, 200) : "";
  return `[stub:${capability}] ${prompt.slice(0, 400)}${ctx ? ` | ctx=${ctx}` : ""}`;
}

export async function indexKnowledge(input: IndexKnowledgeInput) {
  indexKnowledgeSchema.parse(input);
  return indexKnowledgeItem(input);
}

export async function semanticSearch(input: {
  workspaceId: string;
  query: string;
  limit?: number;
}) {
  semanticSearchSchema.parse(input);
  const limit = input.limit ?? 10;
  const lexical = await searchKnowledgeLexical(input.workspaceId, input.query, limit);
  const vectors = await listVectorDocuments(input.workspaceId, 200);
  const ranked = rankBySimilarity(
    stubEmbed(input.query),
    vectors.map((v) => ({
      id: v.id,
      content: v.content,
      embedding: Array.isArray(v.embedding) ? (v.embedding as number[]) : null,
      knowledgeId: v.knowledge_id,
      metadata: v.metadata,
    })),
  ).slice(0, limit);

  return {
    lexical: lexical.map((k) => ({
      id: k.id,
      title: k.title,
      sourceType: k.source_type,
    })),
    vector: ranked,
  };
}

export async function remember(input: {
  workspaceId: string;
  scope: string;
  key: string;
  content: string;
  userId?: string;
  conversationId?: string;
  importance?: number;
}) {
  writeMemorySchema.parse(input);
  return writeMemoryRecord(input);
}

export async function recallMemories(input: {
  workspaceId: string;
  query: string;
  limit?: number;
}) {
  const memories = await listMemories(input.workspaceId, 100);
  return mergeMemoryCandidates(memories, input.query, input.limit ?? 10);
}

export async function generateInsight(input: {
  workspaceId: string;
  insightKind: AiInsightKind;
  title: string;
  summary?: string;
  score?: number;
  payload?: Record<string, unknown>;
  actorUserId?: string;
  businessId?: string;
}): Promise<AiInsightRecord> {
  const agent = await getAgentBySlug(input.workspaceId, "analytics");
  const insight = await createInsightRecord({
    workspaceId: input.workspaceId,
    insightKind: input.insightKind,
    title: input.title,
    summary: input.summary,
    score: input.score,
    payload: input.payload,
    agentId: agent?.id,
  });

  await emit("ai.insight_generated", {
    actorId: input.actorUserId ?? null,
    businessId: input.businessId ?? null,
    payload: {
      insightId: insight.id,
      kind: insight.insight_kind,
      workspaceId: input.workspaceId,
    },
  });

  return {
    id: insight.id,
    workspaceId: insight.workspace_id,
    kind: insight.insight_kind,
    title: insight.title,
    summary: insight.summary,
    score: insight.score,
  };
}

export async function generatePrediction(input: {
  workspaceId: string;
  predictionType: string;
  horizon?: string;
  value?: Record<string, unknown>;
  confidence?: number;
  actorUserId?: string;
  businessId?: string;
}) {
  const prediction = await createPredictionRecord(input);
  await emit("ai.prediction_generated", {
    actorId: input.actorUserId ?? null,
    businessId: input.businessId ?? null,
    payload: { predictionId: prediction.id, type: prediction.prediction_type },
  });
  return prediction;
}

export async function generateReport(input: {
  workspaceId: string;
  title: string;
  reportType?: string;
  bodyMarkdown?: string;
  kpis?: Record<string, unknown>;
  actorUserId?: string;
  businessId?: string;
}) {
  const agent = await getAgentBySlug(input.workspaceId, "analytics");
  const report = await createReportRecord({
    ...input,
    agentId: agent?.id,
  });
  await emit("ai.report_generated", {
    actorId: input.actorUserId ?? null,
    businessId: input.businessId ?? null,
    payload: { reportId: report.id, title: report.title },
  });
  return report;
}

export async function createRecommendation(input: {
  workspaceId: string;
  title: string;
  reason?: string;
  priority?: number;
  actionHint?: string;
  payload?: Record<string, unknown>;
  actorUserId?: string;
  businessId?: string;
}) {
  const recommendation = await createRecommendationRecord(input);
  await emit("ai.recommendation_created", {
    actorId: input.actorUserId ?? null,
    businessId: input.businessId ?? null,
    payload: { recommendationId: recommendation.id, title: recommendation.title },
  });
  return recommendation;
}

export async function executeWorkflow(input: {
  workspaceId: string;
  workflowSlug: string;
  context?: Record<string, unknown>;
  actorUserId?: string;
  businessId?: string;
}): Promise<{ executionId: string; steps: ReturnType<typeof planWorkflowExecution> }> {
  executeWorkflowSchema.parse({
    workspaceId: input.workspaceId,
    workflowSlug: input.workflowSlug,
    input: input.context,
    actorUserId: input.actorUserId,
  });

  const workflow = await getWorkflowBySlug(input.workspaceId, input.workflowSlug);
  const steps =
    workflow?.steps?.length
      ? planWorkflowExecution(
          workflow.steps.map((s, i) => ({
            step: Number(s.step ?? i + 1),
            action: String(s.action ?? "unknown"),
            params: (s.params as Record<string, unknown>) ?? {},
          })),
          input.context,
        )
      : planWorkflowExecution(ORDER_CREATED_PIPELINE, input.context);

  const execution = await createExecutionRecord({
    workspaceId: input.workspaceId,
    workflowId: workflow?.id,
    status: "running",
    input: input.context ?? {},
  });

  await updateExecutionStatus(execution.id, "succeeded", {
    steps,
    note: "Foundation stub — step side-effects plug into owning modules via ports",
  });

  await emit("ai.workflow_executed", {
    actorId: input.actorUserId ?? null,
    businessId: input.businessId ?? null,
    payload: {
      executionId: execution.id,
      workflowSlug: input.workflowSlug,
      stepCount: steps.length,
    },
  });

  await emit("ai.automation_executed", {
    actorId: input.actorUserId ?? null,
    businessId: input.businessId ?? null,
    payload: { executionId: execution.id, workflowSlug: input.workflowSlug },
  });

  await adjustCredits(input.workspaceId, -2, `workflow:${input.workflowSlug}`, execution.id);

  return { executionId: execution.id, steps };
}

export async function handleAiDomainEvent(event: {
  name: string;
  actorId: string | null;
  businessId: string | null;
  payload: Record<string, unknown>;
}): Promise<void> {
  if (!event.businessId) return;
  const workspace = await getWorkspaceByBusinessId(event.businessId);
  if (!workspace) return;

  const slug = workflowSlugForEvent(event.name);
  if (slug) {
    await executeWorkflow({
      workspaceId: workspace.id,
      workflowSlug: slug,
      context: event.payload,
      actorUserId: event.actorId ?? undefined,
      businessId: event.businessId,
    });
    return;
  }

  if (event.name === "invoice.issued") {
    await generateInsight({
      workspaceId: workspace.id,
      insightKind: "custom",
      title: "Invoice issued",
      summary: "Finance signal ingested for AI context",
      score: 0.6,
      payload: event.payload,
      actorUserId: event.actorId ?? undefined,
      businessId: event.businessId,
    });
  }

  if (event.name === "product.published") {
    const title = String(event.payload.title ?? event.payload.name ?? "Product");
    await indexKnowledgeItem({
      workspaceId: workspace.id,
      sourceType: "product",
      title,
      content: String(event.payload.description ?? title),
      sourceEntityId:
        typeof event.payload.productId === "string"
          ? event.payload.productId
          : undefined,
      metadata: event.payload,
    }).catch(() => undefined);
  }
}

export function createAtlasAiPort(): AtlasAiPort {
  return {
    async getWorkspace(businessId) {
      return getBusinessAiWorkspace(businessId);
    },
    async ensureWorkspace(input) {
      return ensureBusinessAi(input);
    },
    async listAgents(workspaceId) {
      return listAgents(workspaceId);
    },
    async startConversation(input) {
      return startConversation(input);
    },
    async runCapability(input) {
      return runCapability({
        workspaceId: input.workspaceId,
        capability: input.capability as AiCapability,
        userId: input.userId,
        prompt: input.prompt,
        agentSlug: input.agentSlug,
        context: input.context,
      });
    },
    async semanticSearch(input) {
      return semanticSearch(input);
    },
    async generateInsight(input) {
      return generateInsight({
        workspaceId: input.workspaceId,
        insightKind: input.insightKind as AiInsightKind,
        title: input.title,
        summary: input.summary,
        score: input.score,
        payload: input.payload,
      });
    },
    async executeWorkflow(input) {
      const result = await executeWorkflow({
        workspaceId: input.workspaceId,
        workflowSlug: input.workflowSlug,
        context: input.context,
      });
      return { executionId: result.executionId };
    },
  };
}

export async function getWorkspaceContext(workspaceId: string) {
  const [workspace, context, agents] = await Promise.all([
    getWorkspaceById(workspaceId),
    getBusinessContext(workspaceId),
    getAgentsByWorkspace(workspaceId),
  ]);
  return { workspace, context, agents };
}

export async function listConversations(workspaceId: string, limit?: number) {
  return getConversationsByWorkspace(workspaceId, limit);
}

export async function listMessages(conversationId: string, limit?: number) {
  return getMessagesByConversation(conversationId, limit);
}

export {
  selectAgentForCapability,
  AGENT_CAPABILITY_ROUTING,
  agentForRole,
} from "./agents";
export {
  stubEmbed,
  cosineSimilarity,
  rankBySimilarity,
} from "./vector";
export {
  ORDER_CREATED_PIPELINE,
  planWorkflowExecution,
  describeAutomationPacks,
} from "./workflows";
export {
  scoreMemoryRelevance,
  mergeMemoryCandidates,
} from "./memory";
