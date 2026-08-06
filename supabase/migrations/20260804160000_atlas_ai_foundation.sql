-- ATLAS AI foundation (additive, backward-compatible)
-- Business Intelligence Engine — not a chatbot.
-- Does NOT modify atlas_network, atlas_pulse, atlas_connect, or commerce masters.
-- Provider-agnostic LLM layer; vector-ready (pgvector when available).

CREATE EXTENSION IF NOT EXISTS vector;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE public.ai_agent_role AS ENUM (
  'ceo', 'sales', 'marketing', 'finance', 'hr', 'support',
  'legal', 'operations', 'inventory', 'analytics', 'developer', 'custom'
);

CREATE TYPE public.ai_capability AS ENUM (
  'generate_content', 'summarize', 'translate', 'analyze', 'predict',
  'forecast', 'recommend', 'search', 'classify', 'extract', 'automate', 'optimize'
);

CREATE TYPE public.ai_memory_scope AS ENUM (
  'user', 'business', 'conversation', 'workspace', 'long_term'
);

CREATE TYPE public.ai_knowledge_source AS ENUM (
  'business_document', 'product', 'service', 'policy', 'invoice',
  'contract', 'employee', 'order', 'analytics', 'marketplace',
  'network', 'connect', 'pulse', 'manual'
);

CREATE TYPE public.ai_tool_kind AS ENUM (
  'crm', 'finance', 'inventory', 'marketplace', 'wallet', 'documents',
  'analytics', 'calendar', 'connect', 'pulse', 'network', 'custom'
);

CREATE TYPE public.ai_workflow_status AS ENUM (
  'draft', 'active', 'paused', 'archived'
);

CREATE TYPE public.ai_execution_status AS ENUM (
  'pending', 'running', 'succeeded', 'failed', 'cancelled'
);

CREATE TYPE public.ai_insight_kind AS ENUM (
  'revenue_forecast', 'sales_forecast', 'customer_behavior',
  'inventory_prediction', 'employee_performance', 'marketing_performance',
  'business_health', 'custom'
);

CREATE TYPE public.ai_automation_trigger AS ENUM (
  'order_created', 'invoice_issued', 'payment_confirmed', 'employee_hired',
  'product_published', 'manual', 'schedule', 'event'
);

CREATE TYPE public.ai_monetization_plan AS ENUM (
  'free', 'credits', 'premium', 'enterprise', 'private_models'
);

-- ---------------------------------------------------------------------------
-- Workspaces (one per business)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_ai_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  monetization_plan public.ai_monetization_plan NOT NULL DEFAULT 'free',
  ai_credits_balance INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_workspaces_business ON public.atlas_ai_workspaces(business_id);

-- ---------------------------------------------------------------------------
-- Business context snapshot (what AI understands about the business)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_ai_business_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL UNIQUE REFERENCES public.atlas_ai_workspaces(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  modules_enabled TEXT[] NOT NULL DEFAULT ARRAY[
    'business','employees','customers','suppliers','partners','marketplace',
    'wallet','crm','finance','inventory','analytics','documents',
    'network','connect','pulse'
  ],
  refreshed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_business_contexts_business
  ON public.atlas_ai_business_contexts(business_id);

-- ---------------------------------------------------------------------------
-- Models (provider-agnostic registry)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  model_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  capabilities public.ai_capability[] NOT NULL DEFAULT '{}',
  context_window INTEGER,
  embedding_dimensions INTEGER,
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, model_key)
);

-- ---------------------------------------------------------------------------
-- Agents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_ai_workspaces(id) ON DELETE CASCADE,
  agent_role public.ai_agent_role NOT NULL DEFAULT 'custom',
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT,
  model_id UUID REFERENCES public.atlas_ai_models(id) ON DELETE SET NULL,
  capabilities public.ai_capability[] NOT NULL DEFAULT '{}',
  tools_enabled public.ai_tool_kind[] NOT NULL DEFAULT '{}',
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_ai_agents_workspace ON public.atlas_ai_agents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_role ON public.atlas_ai_agents(agent_role);

-- ---------------------------------------------------------------------------
-- Conversations (AI sessions — not Connect chat)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_ai_workspaces(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.atlas_ai_agents(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  message_count INTEGER NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_workspace
  ON public.atlas_ai_conversations(workspace_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user
  ON public.atlas_ai_conversations(user_id);

CREATE TABLE IF NOT EXISTS public.atlas_ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.atlas_ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT,
  tool_name TEXT,
  tool_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  model_id UUID REFERENCES public.atlas_ai_models(id) ON DELETE SET NULL,
  tokens_in INTEGER,
  tokens_out INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation
  ON public.atlas_ai_messages(conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- Memory
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_ai_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_ai_workspaces(id) ON DELETE CASCADE,
  scope public.ai_memory_scope NOT NULL DEFAULT 'business',
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.atlas_ai_conversations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  content TEXT NOT NULL,
  importance REAL NOT NULL DEFAULT 0.5,
  expires_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_memories_workspace_scope
  ON public.atlas_ai_memories(workspace_id, scope);
CREATE INDEX IF NOT EXISTS idx_ai_memories_user
  ON public.atlas_ai_memories(user_id) WHERE user_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Knowledge + vector documents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_ai_knowledge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_ai_workspaces(id) ON DELETE CASCADE,
  source_type public.ai_knowledge_source NOT NULL DEFAULT 'manual',
  source_entity_id UUID,
  title TEXT NOT NULL,
  content TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  indexed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_knowledge_workspace
  ON public.atlas_ai_knowledge_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_source
  ON public.atlas_ai_knowledge_items(source_type, source_entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_fts
  ON public.atlas_ai_knowledge_items USING gin (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
  );

CREATE TABLE IF NOT EXISTS public.atlas_ai_vector_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_ai_workspaces(id) ON DELETE CASCADE,
  knowledge_id UUID REFERENCES public.atlas_ai_knowledge_items(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  embedding_dimensions INTEGER,
  -- Provider-agnostic float storage
  embedding JSONB,
  -- pgvector column (1536 default; other dims use JSONB path)
  embedding_vector vector(1536),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_vector_docs_workspace
  ON public.atlas_ai_vector_documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_vector_docs_knowledge
  ON public.atlas_ai_vector_documents(knowledge_id);

-- HNSW index when embeddings present (no-op until data exists)
CREATE INDEX IF NOT EXISTS idx_ai_vector_docs_hnsw
  ON public.atlas_ai_vector_documents
  USING hnsw (embedding_vector vector_cosine_ops);

CREATE TABLE IF NOT EXISTS public.atlas_ai_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_ai_workspaces(id) ON DELETE CASCADE,
  model_id UUID REFERENCES public.atlas_ai_models(id) ON DELETE SET NULL,
  source_table TEXT NOT NULL,
  source_id UUID NOT NULL,
  dimensions INTEGER NOT NULL,
  embedding JSONB NOT NULL,
  embedding_vector vector(1536),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_table, source_id, model_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_embeddings_workspace
  ON public.atlas_ai_embeddings(workspace_id);

-- ---------------------------------------------------------------------------
-- Prompts & templates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_ai_prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.atlas_ai_workspaces(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  capability public.ai_capability NOT NULL DEFAULT 'generate_content',
  template_body TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, slug)
);

CREATE TABLE IF NOT EXISTS public.atlas_ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_ai_workspaces(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.atlas_ai_prompt_templates(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES public.atlas_ai_agents(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rendered_body TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_prompts_workspace ON public.atlas_ai_prompts(workspace_id);

-- ---------------------------------------------------------------------------
-- Tools
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_ai_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.atlas_ai_workspaces(id) ON DELETE CASCADE,
  tool_kind public.ai_tool_kind NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  input_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_system BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, slug)
);

-- ---------------------------------------------------------------------------
-- Workflows & automations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_ai_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_ai_workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  status public.ai_workflow_status NOT NULL DEFAULT 'draft',
  trigger_event TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_ai_workflows_workspace
  ON public.atlas_ai_workflows(workspace_id, status);

CREATE TABLE IF NOT EXISTS public.atlas_ai_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_ai_workspaces(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES public.atlas_ai_workflows(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  trigger_type public.ai_automation_trigger NOT NULL DEFAULT 'event',
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_automations_workspace
  ON public.atlas_ai_automations(workspace_id) WHERE is_active = TRUE;

-- ---------------------------------------------------------------------------
-- Tasks, actions, executions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_ai_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_ai_workspaces(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.atlas_ai_agents(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.atlas_ai_conversations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  capability public.ai_capability,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_tasks_workspace ON public.atlas_ai_tasks(workspace_id, status);

CREATE TABLE IF NOT EXISTS public.atlas_ai_planned_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_ai_workspaces(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.atlas_ai_tasks(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES public.atlas_ai_agents(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status public.ai_execution_status NOT NULL DEFAULT 'pending',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.atlas_ai_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_ai_workspaces(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES public.atlas_ai_workflows(id) ON DELETE SET NULL,
  automation_id UUID REFERENCES public.atlas_ai_automations(id) ON DELETE SET NULL,
  planned_action_id UUID REFERENCES public.atlas_ai_planned_actions(id) ON DELETE SET NULL,
  status public.ai_execution_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_executions_workspace
  ON public.atlas_ai_executions(workspace_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Insights, recommendations, predictions, reports
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_ai_workspaces(id) ON DELETE CASCADE,
  insight_kind public.ai_insight_kind NOT NULL DEFAULT 'custom',
  title TEXT NOT NULL,
  summary TEXT,
  score REAL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_by_agent_id UUID REFERENCES public.atlas_ai_agents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_workspace
  ON public.atlas_ai_insights(workspace_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.atlas_ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_ai_workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  reason TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  action_hint TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.atlas_ai_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_ai_workspaces(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL,
  horizon TEXT,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence REAL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.atlas_ai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_ai_workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'business',
  body_markdown TEXT,
  kpis JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_by_agent_id UUID REFERENCES public.atlas_ai_agents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_reports_workspace
  ON public.atlas_ai_reports(workspace_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Credit ledger (monetization)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_ai_credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_ai_workspaces(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  execution_id UUID REFERENCES public.atlas_ai_executions(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_credits_workspace
  ON public.atlas_ai_credit_ledger(workspace_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Seed system models + default prompt templates (global, workspace_id NULL)
-- ---------------------------------------------------------------------------
INSERT INTO public.atlas_ai_models (provider, model_key, display_name, capabilities, context_window, embedding_dimensions)
VALUES
  ('atlas', 'stub-chat', 'ATLAS Stub Chat', ARRAY['generate_content','summarize','translate','analyze','recommend','classify','extract']::public.ai_capability[], 128000, NULL),
  ('atlas', 'stub-embed', 'ATLAS Stub Embed', ARRAY['search']::public.ai_capability[], NULL, 1536)
ON CONFLICT (provider, model_key) DO NOTHING;

INSERT INTO public.atlas_ai_prompt_templates (workspace_id, slug, name, capability, template_body, is_system)
VALUES
  (NULL, 'generate-quotation', 'Generate Quotation', 'generate_content', 'Generate a professional quotation for {{businessName}} based on: {{context}}', TRUE),
  (NULL, 'generate-contract', 'Generate Contract', 'generate_content', 'Draft a contract for {{businessName}}: {{context}}', TRUE),
  (NULL, 'generate-invoice', 'Generate Invoice', 'generate_content', 'Generate invoice summary for order {{orderId}}: {{context}}', TRUE),
  (NULL, 'generate-email', 'Generate Email', 'generate_content', 'Write a business email: {{context}}', TRUE),
  (NULL, 'generate-report', 'Generate Report', 'analyze', 'Produce a business report covering: {{context}}', TRUE),
  (NULL, 'generate-business-plan', 'Generate Business Plan', 'generate_content', 'Create a business plan for {{businessName}}: {{context}}', TRUE),
  (NULL, 'generate-product-description', 'Generate Product Description', 'generate_content', 'Write a product description: {{context}}', TRUE),
  (NULL, 'generate-marketing-campaign', 'Generate Marketing Campaign', 'generate_content', 'Design a marketing campaign: {{context}}', TRUE),
  (NULL, 'generate-job-post', 'Generate Job Post', 'generate_content', 'Write a job posting: {{context}}', TRUE),
  (NULL, 'summarize-conversation', 'Summarize Conversation', 'summarize', 'Summarize the following conversation: {{context}}', TRUE)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Auto-provision AI workspace + default agents on Business INSERT
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.ensure_atlas_ai_for_business()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wid UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM public.atlas_ai_workspaces WHERE business_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.atlas_ai_workspaces (business_id, owner_user_id, name, slug, ai_credits_balance)
  VALUES (NEW.id, NEW.owner_user_id, NEW.display_name || ' AI', NEW.slug || '-ai', 100)
  RETURNING id INTO wid;

  INSERT INTO public.atlas_ai_business_contexts (workspace_id, business_id, context)
  VALUES (wid, NEW.id, jsonb_build_object('displayName', NEW.display_name, 'slug', NEW.slug));

  INSERT INTO public.atlas_ai_agents (workspace_id, agent_role, name, slug, description, is_system, capabilities, tools_enabled)
  VALUES
    (wid, 'ceo', 'CEO Agent', 'ceo', 'Strategic business intelligence', TRUE,
      ARRAY['analyze','recommend','forecast','optimize']::public.ai_capability[],
      ARRAY['analytics','crm','finance','documents']::public.ai_tool_kind[]),
    (wid, 'sales', 'Sales Agent', 'sales', 'Sales and CRM automation', TRUE,
      ARRAY['generate_content','recommend','classify','extract']::public.ai_capability[],
      ARRAY['crm','marketplace','calendar','connect']::public.ai_tool_kind[]),
    (wid, 'marketing', 'Marketing Agent', 'marketing', 'Campaigns and content', TRUE,
      ARRAY['generate_content','summarize','optimize']::public.ai_capability[],
      ARRAY['analytics','marketplace','pulse','network']::public.ai_tool_kind[]),
    (wid, 'finance', 'Finance Agent', 'finance', 'Invoices, forecasts, wallet', TRUE,
      ARRAY['analyze','forecast','predict','generate_content']::public.ai_capability[],
      ARRAY['finance','wallet','analytics','documents']::public.ai_tool_kind[]),
    (wid, 'hr', 'HR Agent', 'hr', 'People and hiring', TRUE,
      ARRAY['generate_content','summarize','classify']::public.ai_capability[],
      ARRAY['documents','calendar','connect']::public.ai_tool_kind[]),
    (wid, 'support', 'Support Agent', 'support', 'Customer support', TRUE,
      ARRAY['summarize','classify','recommend','translate']::public.ai_capability[],
      ARRAY['crm','connect','documents']::public.ai_tool_kind[]),
    (wid, 'legal', 'Legal Agent', 'legal', 'Contracts and compliance', TRUE,
      ARRAY['generate_content','extract','analyze']::public.ai_capability[],
      ARRAY['documents']::public.ai_tool_kind[]),
    (wid, 'operations', 'Operations Agent', 'operations', 'Workflows and ops', TRUE,
      ARRAY['automate','optimize','analyze']::public.ai_capability[],
      ARRAY['inventory','analytics','connect','calendar']::public.ai_tool_kind[]),
    (wid, 'inventory', 'Inventory Agent', 'inventory', 'Stock and forecasting', TRUE,
      ARRAY['predict','forecast','optimize']::public.ai_capability[],
      ARRAY['inventory','marketplace','analytics']::public.ai_tool_kind[]),
    (wid, 'analytics', 'Analytics Agent', 'analytics', 'KPIs and insights', TRUE,
      ARRAY['analyze','forecast','predict','recommend']::public.ai_capability[],
      ARRAY['analytics','marketplace','finance','pulse']::public.ai_tool_kind[]),
    (wid, 'developer', 'Developer Agent', 'developer', 'API and automation tooling', TRUE,
      ARRAY['generate_content','automate','extract']::public.ai_capability[],
      ARRAY['custom','analytics','documents']::public.ai_tool_kind[]);

  -- Default order-created workflow
  INSERT INTO public.atlas_ai_workflows (
    workspace_id, name, slug, description, status, trigger_event, steps, created_by
  ) VALUES (
    wid,
    'Order Created Pipeline',
    'order-created',
    'Notify team → invoice → analytics → CRM → customer → follow-up',
    'active',
    'order.placed',
    jsonb_build_array(
      jsonb_build_object('step', 1, 'action', 'notify_team'),
      jsonb_build_object('step', 2, 'action', 'generate_invoice'),
      jsonb_build_object('step', 3, 'action', 'update_analytics'),
      jsonb_build_object('step', 4, 'action', 'update_crm'),
      jsonb_build_object('step', 5, 'action', 'notify_customer'),
      jsonb_build_object('step', 6, 'action', 'schedule_follow_up')
    ),
    NEW.owner_user_id
  );

  INSERT INTO public.atlas_ai_automations (workspace_id, name, trigger_type, trigger_config, is_active)
  SELECT wid, 'On Order Created', 'order_created', jsonb_build_object('workflowSlug', 'order-created'), TRUE;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS businesses_ensure_ai ON public.businesses;
CREATE TRIGGER businesses_ensure_ai
  AFTER INSERT ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION private.ensure_atlas_ai_for_business();

-- Backfill existing businesses
DO $$
DECLARE r RECORD; wid UUID;
BEGIN
  FOR r IN SELECT * FROM public.businesses WHERE deleted_at IS NULL LOOP
    IF EXISTS (SELECT 1 FROM public.atlas_ai_workspaces WHERE business_id = r.id) THEN
      CONTINUE;
    END IF;
    INSERT INTO public.atlas_ai_workspaces (business_id, owner_user_id, name, slug, ai_credits_balance)
    VALUES (r.id, r.owner_user_id, r.display_name || ' AI', r.slug || '-ai', 100)
    RETURNING id INTO wid;
    INSERT INTO public.atlas_ai_business_contexts (workspace_id, business_id, context)
    VALUES (wid, r.id, jsonb_build_object('displayName', r.display_name, 'slug', r.slug));
    INSERT INTO public.atlas_ai_agents (workspace_id, agent_role, name, slug, is_system, capabilities)
    VALUES
      (wid, 'ceo', 'CEO Agent', 'ceo', TRUE, ARRAY['analyze','recommend']::public.ai_capability[]),
      (wid, 'sales', 'Sales Agent', 'sales', TRUE, ARRAY['generate_content','recommend']::public.ai_capability[]),
      (wid, 'finance', 'Finance Agent', 'finance', TRUE, ARRAY['analyze','forecast']::public.ai_capability[]),
      (wid, 'analytics', 'Analytics Agent', 'analytics', TRUE, ARRAY['analyze','predict']::public.ai_capability[]);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.is_ai_workspace_member(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.atlas_ai_workspaces w
    JOIN public.business_memberships bm ON bm.business_id = w.business_id
    WHERE w.id = p_workspace_id
      AND bm.user_id = auth.uid()
      AND bm.revoked_at IS NULL
      AND bm.status = 'active'::public.business_member_status
  ) OR EXISTS (
    SELECT 1 FROM public.atlas_ai_workspaces w
    WHERE w.id = p_workspace_id AND w.owner_user_id = auth.uid()
  ) OR private.current_user_role() = 'admin'::public.user_role;
$$;

ALTER TABLE public.atlas_ai_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_ai_business_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_ai_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_ai_knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_ai_vector_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_ai_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_ai_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_ai_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_ai_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_ai_planned_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_ai_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_ai_credit_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read AI workspaces" ON public.atlas_ai_workspaces
  FOR SELECT USING (private.is_ai_workspace_member(id));

CREATE POLICY "Members read AI agents" ON public.atlas_ai_agents
  FOR SELECT USING (private.is_ai_workspace_member(workspace_id));

CREATE POLICY "Members read AI conversations" ON public.atlas_ai_conversations
  FOR SELECT USING (
    private.is_ai_workspace_member(workspace_id)
    OR user_id = auth.uid()
  );

CREATE POLICY "Members read AI insights" ON public.atlas_ai_insights
  FOR SELECT USING (private.is_ai_workspace_member(workspace_id));

CREATE POLICY "Members read AI knowledge" ON public.atlas_ai_knowledge_items
  FOR SELECT USING (private.is_ai_workspace_member(workspace_id));

CREATE POLICY "Members read AI workflows" ON public.atlas_ai_workflows
  FOR SELECT USING (private.is_ai_workspace_member(workspace_id));
