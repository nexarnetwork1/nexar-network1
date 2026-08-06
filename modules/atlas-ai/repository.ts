import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AiAgent,
  AiBusinessContext,
  AiConversation,
  AiExecution,
  AiInsight,
  AiKnowledgeItem,
  AiMemory,
  AiMessage,
  AiPrediction,
  AiRecommendation,
  AiReport,
  AiTask,
  AiVectorDocument,
  AiWorkflow,
  AiWorkspace,
  EnsureAiWorkspaceInput,
  IndexKnowledgeInput,
} from "./types";
import { DEFAULT_AI_AGENTS } from "./types";
import { stubEmbed, toPgVector1536 } from "./vector";

function db() {
  return createAdminClient();
}

export async function getWorkspaceByBusinessId(
  businessId: string,
): Promise<AiWorkspace | null> {
  const { data } = await db()
    .from("atlas_ai_workspaces")
    .select("*")
    .eq("business_id", businessId)
    .is("deleted_at", null)
    .maybeSingle();
  return (data as AiWorkspace | null) ?? null;
}

export async function getWorkspaceById(
  workspaceId: string,
): Promise<AiWorkspace | null> {
  const { data } = await db()
    .from("atlas_ai_workspaces")
    .select("*")
    .eq("id", workspaceId)
    .is("deleted_at", null)
    .maybeSingle();
  return (data as AiWorkspace | null) ?? null;
}

export async function ensureBusinessAiWorkspace(
  input: EnsureAiWorkspaceInput,
): Promise<AiWorkspace> {
  let workspace = await getWorkspaceByBusinessId(input.businessId);

  if (!workspace) {
    const { data, error } = await db()
      .from("atlas_ai_workspaces")
      .insert({
        business_id: input.businessId,
        owner_user_id: input.ownerUserId,
        name: `${input.displayName} AI`,
        slug: `${input.slug}-ai`,
        ai_credits_balance: 100,
        metadata: { source: "ensureBusinessAiWorkspace" },
      })
      .select("*")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to create AI workspace");
    workspace = data as AiWorkspace;

    await db().from("atlas_ai_business_contexts").insert({
      workspace_id: workspace.id,
      business_id: input.businessId,
      context: { displayName: input.displayName, slug: input.slug },
    });

    for (const agent of DEFAULT_AI_AGENTS) {
      await db().from("atlas_ai_agents").insert({
        workspace_id: workspace.id,
        agent_role: agent.role,
        name: agent.name,
        slug: agent.slug,
        description: agent.description,
        capabilities: agent.capabilities,
        tools_enabled: agent.tools,
        is_system: true,
      });
    }

    await db().from("atlas_ai_workflows").insert({
      workspace_id: workspace.id,
      name: "Order Created Pipeline",
      slug: "order-created",
      description: "Notify → invoice → analytics → CRM → customer → follow-up",
      status: "active",
      trigger_event: "order.placed",
      steps: [
        { step: 1, action: "notify_team" },
        { step: 2, action: "generate_invoice" },
        { step: 3, action: "update_analytics" },
        { step: 4, action: "update_crm" },
        { step: 5, action: "notify_customer" },
        { step: 6, action: "schedule_follow_up" },
      ],
      created_by: input.ownerUserId,
    });
  } else {
    const agents = await getAgentsByWorkspace(workspace.id);
    const existing = new Set(agents.map((a) => a.slug));
    for (const agent of DEFAULT_AI_AGENTS) {
      if (existing.has(agent.slug)) continue;
      await db().from("atlas_ai_agents").insert({
        workspace_id: workspace.id,
        agent_role: agent.role,
        name: agent.name,
        slug: agent.slug,
        description: agent.description,
        capabilities: agent.capabilities,
        tools_enabled: agent.tools,
        is_system: true,
      });
    }
  }

  return workspace;
}

export async function getBusinessContext(
  workspaceId: string,
): Promise<AiBusinessContext | null> {
  const { data } = await db()
    .from("atlas_ai_business_contexts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  return (data as AiBusinessContext | null) ?? null;
}

export async function getAgentsByWorkspace(
  workspaceId: string,
): Promise<AiAgent[]> {
  const { data } = await db()
    .from("atlas_ai_agents")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true)
    .order("name");
  return (data as AiAgent[]) ?? [];
}

export async function getAgentBySlug(
  workspaceId: string,
  slug: string,
): Promise<AiAgent | null> {
  const { data } = await db()
    .from("atlas_ai_agents")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("slug", slug)
    .maybeSingle();
  return (data as AiAgent | null) ?? null;
}

export async function createConversationRecord(input: {
  workspaceId: string;
  userId: string;
  agentId?: string;
  title?: string;
}): Promise<AiConversation> {
  const { data, error } = await db()
    .from("atlas_ai_conversations")
    .insert({
      workspace_id: input.workspaceId,
      user_id: input.userId,
      agent_id: input.agentId ?? null,
      title: input.title ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create conversation");
  return data as AiConversation;
}

export async function getConversationsByWorkspace(
  workspaceId: string,
  limit = 50,
): Promise<AiConversation[]> {
  const { data } = await db()
    .from("atlas_ai_conversations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  return (data as AiConversation[]) ?? [];
}

export async function createMessageRecord(input: {
  conversationId: string;
  role: AiMessage["role"];
  content?: string;
  toolName?: string;
  toolPayload?: Record<string, unknown>;
}): Promise<AiMessage> {
  const { data, error } = await db()
    .from("atlas_ai_messages")
    .insert({
      conversation_id: input.conversationId,
      role: input.role,
      content: input.content ?? null,
      tool_name: input.toolName ?? null,
      tool_payload: input.toolPayload ?? {},
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create message");

  const { data: conv } = await db()
    .from("atlas_ai_conversations")
    .select("message_count")
    .eq("id", input.conversationId)
    .maybeSingle();
  await db()
    .from("atlas_ai_conversations")
    .update({
      last_message_at: data.created_at,
      message_count: ((conv as { message_count?: number } | null)?.message_count ?? 0) + 1,
    })
    .eq("id", input.conversationId);

  return data as AiMessage;
}

export async function getMessagesByConversation(
  conversationId: string,
  limit = 50,
): Promise<AiMessage[]> {
  const { data } = await db()
    .from("atlas_ai_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);
  return (data as AiMessage[]) ?? [];
}

export async function writeMemoryRecord(input: {
  workspaceId: string;
  scope: string;
  key: string;
  content: string;
  userId?: string;
  conversationId?: string;
  importance?: number;
}): Promise<AiMemory> {
  const { data, error } = await db()
    .from("atlas_ai_memories")
    .insert({
      workspace_id: input.workspaceId,
      scope: input.scope,
      key: input.key,
      content: input.content,
      user_id: input.userId ?? null,
      conversation_id: input.conversationId ?? null,
      importance: input.importance ?? 0.5,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to write memory");
  return data as AiMemory;
}

export async function listMemories(
  workspaceId: string,
  limit = 50,
): Promise<AiMemory[]> {
  const { data } = await db()
    .from("atlas_ai_memories")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data as AiMemory[]) ?? [];
}

export async function indexKnowledgeItem(
  input: IndexKnowledgeInput,
): Promise<AiKnowledgeItem> {
  const { data, error } = await db()
    .from("atlas_ai_knowledge_items")
    .insert({
      workspace_id: input.workspaceId,
      source_type: input.sourceType,
      title: input.title,
      content: input.content,
      source_entity_id: input.sourceEntityId ?? null,
      metadata: input.metadata ?? {},
      indexed_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to index knowledge");

  const embedding = stubEmbed(input.content);
  await upsertVectorDocument({
    workspaceId: input.workspaceId,
    knowledgeId: data.id,
    content: input.content,
    embedding,
  });

  return data as AiKnowledgeItem;
}

export async function upsertVectorDocument(input: {
  workspaceId: string;
  knowledgeId?: string;
  content: string;
  embedding: number[];
  chunkIndex?: number;
}): Promise<AiVectorDocument> {
  const vector1536 = toPgVector1536(input.embedding);
  const { data, error } = await db()
    .from("atlas_ai_vector_documents")
    .insert({
      workspace_id: input.workspaceId,
      knowledge_id: input.knowledgeId ?? null,
      chunk_index: input.chunkIndex ?? 0,
      content: input.content,
      embedding_dimensions: input.embedding.length,
      embedding: input.embedding,
      embedding_vector: `[${vector1536.join(",")}]`,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to store vector doc");
  return data as AiVectorDocument;
}

export async function listVectorDocuments(
  workspaceId: string,
  limit = 100,
): Promise<AiVectorDocument[]> {
  const { data } = await db()
    .from("atlas_ai_vector_documents")
    .select("*")
    .eq("workspace_id", workspaceId)
    .limit(limit);
  return (data as AiVectorDocument[]) ?? [];
}

export async function searchKnowledgeLexical(
  workspaceId: string,
  query: string,
  limit = 20,
): Promise<AiKnowledgeItem[]> {
  const { data } = await db()
    .from("atlas_ai_knowledge_items")
    .select("*")
    .eq("workspace_id", workspaceId)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .limit(limit);
  return (data as AiKnowledgeItem[]) ?? [];
}

export async function createTaskRecord(input: {
  workspaceId: string;
  title: string;
  description?: string;
  capability?: string;
  agentId?: string;
  conversationId?: string;
  createdBy?: string;
  result?: Record<string, unknown>;
}): Promise<AiTask> {
  const { data, error } = await db()
    .from("atlas_ai_tasks")
    .insert({
      workspace_id: input.workspaceId,
      title: input.title,
      description: input.description ?? null,
      capability: input.capability ?? null,
      agent_id: input.agentId ?? null,
      conversation_id: input.conversationId ?? null,
      created_by: input.createdBy ?? null,
      result: input.result ?? {},
      status: "open",
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create AI task");
  return data as AiTask;
}

export async function createInsightRecord(input: {
  workspaceId: string;
  insightKind: string;
  title: string;
  summary?: string;
  score?: number;
  payload?: Record<string, unknown>;
  agentId?: string;
}): Promise<AiInsight> {
  const { data, error } = await db()
    .from("atlas_ai_insights")
    .insert({
      workspace_id: input.workspaceId,
      insight_kind: input.insightKind,
      title: input.title,
      summary: input.summary ?? null,
      score: input.score ?? null,
      payload: input.payload ?? {},
      generated_by_agent_id: input.agentId ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create insight");
  return data as AiInsight;
}

export async function createRecommendationRecord(input: {
  workspaceId: string;
  title: string;
  reason?: string;
  priority?: number;
  actionHint?: string;
  payload?: Record<string, unknown>;
}): Promise<AiRecommendation> {
  const { data, error } = await db()
    .from("atlas_ai_recommendations")
    .insert({
      workspace_id: input.workspaceId,
      title: input.title,
      reason: input.reason ?? null,
      priority: input.priority ?? 0,
      action_hint: input.actionHint ?? null,
      payload: input.payload ?? {},
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create recommendation");
  return data as AiRecommendation;
}

export async function createPredictionRecord(input: {
  workspaceId: string;
  predictionType: string;
  horizon?: string;
  value?: Record<string, unknown>;
  confidence?: number;
  payload?: Record<string, unknown>;
}): Promise<AiPrediction> {
  const { data, error } = await db()
    .from("atlas_ai_predictions")
    .insert({
      workspace_id: input.workspaceId,
      prediction_type: input.predictionType,
      horizon: input.horizon ?? null,
      value: input.value ?? {},
      confidence: input.confidence ?? null,
      payload: input.payload ?? {},
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create prediction");
  return data as AiPrediction;
}

export async function createReportRecord(input: {
  workspaceId: string;
  title: string;
  reportType?: string;
  bodyMarkdown?: string;
  kpis?: Record<string, unknown>;
  agentId?: string;
}): Promise<AiReport> {
  const { data, error } = await db()
    .from("atlas_ai_reports")
    .insert({
      workspace_id: input.workspaceId,
      title: input.title,
      report_type: input.reportType ?? "business",
      body_markdown: input.bodyMarkdown ?? null,
      kpis: input.kpis ?? {},
      generated_by_agent_id: input.agentId ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create report");
  return data as AiReport;
}

export async function getWorkflowBySlug(
  workspaceId: string,
  slug: string,
): Promise<AiWorkflow | null> {
  const { data } = await db()
    .from("atlas_ai_workflows")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("slug", slug)
    .maybeSingle();
  return (data as AiWorkflow | null) ?? null;
}

export async function createExecutionRecord(input: {
  workspaceId: string;
  workflowId?: string;
  automationId?: string;
  status?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}): Promise<AiExecution> {
  const { data, error } = await db()
    .from("atlas_ai_executions")
    .insert({
      workspace_id: input.workspaceId,
      workflow_id: input.workflowId ?? null,
      automation_id: input.automationId ?? null,
      status: input.status ?? "pending",
      input: input.input ?? {},
      output: input.output ?? {},
      started_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create execution");
  return data as AiExecution;
}

export async function updateExecutionStatus(
  executionId: string,
  status: string,
  output?: Record<string, unknown>,
  errorMsg?: string,
): Promise<AiExecution> {
  const { data, error } = await db()
    .from("atlas_ai_executions")
    .update({
      status,
      output: output ?? {},
      error: errorMsg ?? null,
      finished_at: new Date().toISOString(),
    })
    .eq("id", executionId)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to update execution");
  return data as AiExecution;
}

export async function adjustCredits(
  workspaceId: string,
  delta: number,
  reason: string,
  executionId?: string,
): Promise<void> {
  const workspace = await getWorkspaceById(workspaceId);
  if (!workspace) throw new Error("Workspace not found");
  await db()
    .from("atlas_ai_workspaces")
    .update({
      ai_credits_balance: Math.max(0, workspace.ai_credits_balance + delta),
      updated_at: new Date().toISOString(),
    })
    .eq("id", workspaceId);
  await db().from("atlas_ai_credit_ledger").insert({
    workspace_id: workspaceId,
    delta,
    reason,
    execution_id: executionId ?? null,
  });
}
