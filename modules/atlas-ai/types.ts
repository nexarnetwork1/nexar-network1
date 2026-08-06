/**
 * ATLAS AI — domain types.
 * Business Intelligence Engine — not a chatbot.
 */

export type AiAgentRole =
  | "ceo"
  | "sales"
  | "marketing"
  | "finance"
  | "hr"
  | "support"
  | "legal"
  | "operations"
  | "inventory"
  | "analytics"
  | "developer"
  | "custom";

export type AiCapability =
  | "generate_content"
  | "summarize"
  | "translate"
  | "analyze"
  | "predict"
  | "forecast"
  | "recommend"
  | "search"
  | "classify"
  | "extract"
  | "automate"
  | "optimize";

export type AiMemoryScope =
  | "user"
  | "business"
  | "conversation"
  | "workspace"
  | "long_term";

export type AiKnowledgeSource =
  | "business_document"
  | "product"
  | "service"
  | "policy"
  | "invoice"
  | "contract"
  | "employee"
  | "order"
  | "analytics"
  | "marketplace"
  | "network"
  | "connect"
  | "pulse"
  | "manual";

export type AiToolKind =
  | "crm"
  | "finance"
  | "inventory"
  | "marketplace"
  | "wallet"
  | "documents"
  | "analytics"
  | "calendar"
  | "connect"
  | "pulse"
  | "network"
  | "custom";

export type AiWorkflowStatus = "draft" | "active" | "paused" | "archived";

export type AiExecutionStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export type AiInsightKind =
  | "revenue_forecast"
  | "sales_forecast"
  | "customer_behavior"
  | "inventory_prediction"
  | "employee_performance"
  | "marketing_performance"
  | "business_health"
  | "custom";

export type AiAutomationTrigger =
  | "order_created"
  | "invoice_issued"
  | "payment_confirmed"
  | "employee_hired"
  | "product_published"
  | "manual"
  | "schedule"
  | "event";

export type AiMonetizationPlan =
  | "free"
  | "credits"
  | "premium"
  | "enterprise"
  | "private_models";

export type AiMonetizationFeature =
  | "ai_credits"
  | "premium_ai"
  | "enterprise_ai"
  | "private_models"
  | "business_agents"
  | "custom_agents"
  | "automation_packs";

export const BUSINESS_CONTEXT_MODULES = [
  "business",
  "employees",
  "customers",
  "suppliers",
  "partners",
  "marketplace",
  "wallet",
  "crm",
  "finance",
  "inventory",
  "analytics",
  "documents",
  "network",
  "connect",
  "pulse",
] as const;

export type AiWorkspace = {
  id: string;
  business_id: string;
  owner_user_id: string;
  name: string;
  slug: string;
  monetization_plan: AiMonetizationPlan;
  ai_credits_balance: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type AiBusinessContext = {
  id: string;
  workspace_id: string;
  business_id: string;
  context: Record<string, unknown>;
  modules_enabled: string[];
  refreshed_at: string;
  created_at: string;
  updated_at: string;
};

export type AiAgent = {
  id: string;
  workspace_id: string;
  agent_role: AiAgentRole;
  name: string;
  slug: string;
  description: string | null;
  system_prompt: string | null;
  model_id: string | null;
  capabilities: AiCapability[];
  tools_enabled: AiToolKind[];
  is_system: boolean;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AiConversation = {
  id: string;
  workspace_id: string;
  agent_id: string | null;
  user_id: string;
  title: string | null;
  status: string;
  message_count: number;
  last_message_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export type AiMessage = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string | null;
  tool_name: string | null;
  tool_payload: Record<string, unknown>;
  model_id: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AiMemory = {
  id: string;
  workspace_id: string;
  scope: AiMemoryScope;
  user_id: string | null;
  conversation_id: string | null;
  key: string;
  content: string;
  importance: number;
  expires_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AiKnowledgeItem = {
  id: string;
  workspace_id: string;
  source_type: AiKnowledgeSource;
  source_entity_id: string | null;
  title: string;
  content: string | null;
  metadata: Record<string, unknown>;
  indexed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AiVectorDocument = {
  id: string;
  workspace_id: string;
  knowledge_id: string | null;
  chunk_index: number;
  content: string;
  embedding_dimensions: number | null;
  embedding: number[] | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AiModel = {
  id: string;
  provider: string;
  model_key: string;
  display_name: string;
  capabilities: AiCapability[];
  context_window: number | null;
  embedding_dimensions: number | null;
  is_private: boolean;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AiPromptTemplate = {
  id: string;
  workspace_id: string | null;
  slug: string;
  name: string;
  capability: AiCapability;
  template_body: string;
  variables: unknown[];
  is_system: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AiWorkflow = {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  description: string | null;
  status: AiWorkflowStatus;
  trigger_event: string | null;
  steps: Array<Record<string, unknown>>;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AiAutomation = {
  id: string;
  workspace_id: string;
  workflow_id: string | null;
  name: string;
  trigger_type: AiAutomationTrigger;
  trigger_config: Record<string, unknown>;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AiTask = {
  id: string;
  workspace_id: string;
  agent_id: string | null;
  conversation_id: string | null;
  title: string;
  description: string | null;
  status: string;
  capability: AiCapability | null;
  result: Record<string, unknown>;
  created_by: string | null;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AiExecution = {
  id: string;
  workspace_id: string;
  workflow_id: string | null;
  automation_id: string | null;
  planned_action_id: string | null;
  status: AiExecutionStatus;
  started_at: string | null;
  finished_at: string | null;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  error: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AiInsight = {
  id: string;
  workspace_id: string;
  insight_kind: AiInsightKind;
  title: string;
  summary: string | null;
  score: number | null;
  payload: Record<string, unknown>;
  generated_by_agent_id: string | null;
  created_at: string;
};

export type AiRecommendation = {
  id: string;
  workspace_id: string;
  title: string;
  reason: string | null;
  priority: number;
  action_hint: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

export type AiPrediction = {
  id: string;
  workspace_id: string;
  prediction_type: string;
  horizon: string | null;
  value: Record<string, unknown>;
  confidence: number | null;
  payload: Record<string, unknown>;
  created_at: string;
};

export type AiReport = {
  id: string;
  workspace_id: string;
  title: string;
  report_type: string;
  body_markdown: string | null;
  kpis: Record<string, unknown>;
  generated_by_agent_id: string | null;
  created_at: string;
};

export const DEFAULT_AI_AGENTS: ReadonlyArray<{
  role: AiAgentRole;
  name: string;
  slug: string;
  description: string;
  capabilities: AiCapability[];
  tools: AiToolKind[];
}> = [
  {
    role: "ceo",
    name: "CEO Agent",
    slug: "ceo",
    description: "Strategic business intelligence",
    capabilities: ["analyze", "recommend", "forecast", "optimize"],
    tools: ["analytics", "crm", "finance", "documents"],
  },
  {
    role: "sales",
    name: "Sales Agent",
    slug: "sales",
    description: "Sales and CRM automation",
    capabilities: ["generate_content", "recommend", "classify", "extract"],
    tools: ["crm", "marketplace", "calendar", "connect"],
  },
  {
    role: "marketing",
    name: "Marketing Agent",
    slug: "marketing",
    description: "Campaigns and content",
    capabilities: ["generate_content", "summarize", "optimize"],
    tools: ["analytics", "marketplace", "pulse", "network"],
  },
  {
    role: "finance",
    name: "Finance Agent",
    slug: "finance",
    description: "Invoices, forecasts, wallet",
    capabilities: ["analyze", "forecast", "predict", "generate_content"],
    tools: ["finance", "wallet", "analytics", "documents"],
  },
  {
    role: "hr",
    name: "HR Agent",
    slug: "hr",
    description: "People and hiring",
    capabilities: ["generate_content", "summarize", "classify"],
    tools: ["documents", "calendar", "connect"],
  },
  {
    role: "support",
    name: "Support Agent",
    slug: "support",
    description: "Customer support",
    capabilities: ["summarize", "classify", "recommend", "translate"],
    tools: ["crm", "connect", "documents"],
  },
  {
    role: "legal",
    name: "Legal Agent",
    slug: "legal",
    description: "Contracts and compliance",
    capabilities: ["generate_content", "extract", "analyze"],
    tools: ["documents"],
  },
  {
    role: "operations",
    name: "Operations Agent",
    slug: "operations",
    description: "Workflows and ops",
    capabilities: ["automate", "optimize", "analyze"],
    tools: ["inventory", "analytics", "connect", "calendar"],
  },
  {
    role: "inventory",
    name: "Inventory Agent",
    slug: "inventory",
    description: "Stock and forecasting",
    capabilities: ["predict", "forecast", "optimize"],
    tools: ["inventory", "marketplace", "analytics"],
  },
  {
    role: "analytics",
    name: "Analytics Agent",
    slug: "analytics",
    description: "KPIs and insights",
    capabilities: ["analyze", "forecast", "predict", "recommend"],
    tools: ["analytics", "marketplace", "finance", "pulse"],
  },
  {
    role: "developer",
    name: "Developer Agent",
    slug: "developer",
    description: "API and automation tooling",
    capabilities: ["generate_content", "automate", "extract"],
    tools: ["custom", "analytics", "documents"],
  },
];

export const ORDER_CREATED_WORKFLOW_STEPS = [
  { step: 1, action: "notify_team" },
  { step: 2, action: "generate_invoice" },
  { step: 3, action: "update_analytics" },
  { step: 4, action: "update_crm" },
  { step: 5, action: "notify_customer" },
  { step: 6, action: "schedule_follow_up" },
] as const;

export const AI_EVENT_HANDLERS: Record<
  string,
  { action: "provision" | "workflow" | "insight" | "notify"; description: string }
> = {
  "business.created": { action: "provision", description: "Ensure AI workspace" },
  "order.placed": { action: "workflow", description: "Order-created pipeline" },
  "order.paid": { action: "workflow", description: "Post-payment intelligence" },
  "invoice.issued": { action: "insight", description: "Finance insight" },
  "payment.confirmed": { action: "notify", description: "Payment intelligence note" },
  "employee.hired": { action: "notify", description: "HR context refresh" },
  "product.published": { action: "insight", description: "Catalog knowledge index hint" },
};

export type EnsureAiWorkspaceInput = {
  businessId: string;
  ownerUserId: string;
  displayName: string;
  slug: string;
};

export type CreateAiConversationInput = {
  workspaceId: string;
  userId: string;
  agentId?: string;
  title?: string;
};

export type RunCapabilityInput = {
  workspaceId: string;
  capability: AiCapability;
  userId: string;
  prompt: string;
  agentSlug?: string;
  context?: Record<string, unknown>;
};

export type IndexKnowledgeInput = {
  workspaceId: string;
  sourceType: AiKnowledgeSource;
  title: string;
  content: string;
  sourceEntityId?: string;
  metadata?: Record<string, unknown>;
};
