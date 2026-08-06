-- ATLAS Core Integration foundation (additive)
-- One Platform / One Brain — orchestration, outbox, timeline, search, analytics bridge.
-- Does NOT own Business/Product/Order masters.

-- ---------------------------------------------------------------------------
-- Durable outbox (prepare for queue transport)
-- ---------------------------------------------------------------------------
CREATE TYPE public.core_outbox_status AS ENUM (
  'pending', 'processing', 'published', 'failed', 'dead'
);

CREATE TABLE IF NOT EXISTS public.atlas_core_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  actor_id UUID,
  business_id UUID,
  correlation_id UUID NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status public.core_outbox_status NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id)
);

CREATE INDEX IF NOT EXISTS idx_core_outbox_pending
  ON public.atlas_core_outbox(status, created_at)
  WHERE status IN ('pending', 'failed');
CREATE INDEX IF NOT EXISTS idx_core_outbox_name
  ON public.atlas_core_outbox(event_name, created_at DESC);

-- ---------------------------------------------------------------------------
-- Unified activity timeline
-- ---------------------------------------------------------------------------
CREATE TYPE public.core_timeline_scope AS ENUM (
  'business', 'customer', 'company', 'platform', 'user'
);

CREATE TABLE IF NOT EXISTS public.atlas_core_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope public.core_timeline_scope NOT NULL DEFAULT 'business',
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  entity_type TEXT,
  entity_id UUID,
  source_event_id UUID,
  correlation_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_core_timeline_business
  ON public.atlas_core_timeline_events(business_id, occurred_at DESC)
  WHERE business_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_core_timeline_user
  ON public.atlas_core_timeline_events(user_id, occurred_at DESC)
  WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_core_timeline_scope
  ON public.atlas_core_timeline_events(scope, occurred_at DESC);

-- ---------------------------------------------------------------------------
-- Unified search index (projections — masters stay in owning modules)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_core_search_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  locale TEXT DEFAULT 'en',
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  rank_boost REAL NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_core_search_fts
  ON public.atlas_core_search_documents USING gin (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
  );
CREATE INDEX IF NOT EXISTS idx_core_search_type
  ON public.atlas_core_search_documents(entity_type) WHERE is_published;
CREATE INDEX IF NOT EXISTS idx_core_search_business
  ON public.atlas_core_search_documents(business_id) WHERE business_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Analytics facts (event-derived — not a second truth)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_core_analytics_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  business_id UUID,
  user_id UUID,
  entity_type TEXT,
  entity_id UUID,
  metric_key TEXT NOT NULL DEFAULT 'event',
  metric_value NUMERIC(20, 8) NOT NULL DEFAULT 1,
  dimensions JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_event_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_core_analytics_event
  ON public.atlas_core_analytics_facts(event_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_core_analytics_business
  ON public.atlas_core_analytics_facts(business_id, occurred_at DESC)
  WHERE business_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Workflow runs (orchestration audit)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_core_workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_key TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  source_event_id UUID,
  business_id UUID,
  status TEXT NOT NULL DEFAULT 'completed',
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_core_workflow_key
  ON public.atlas_core_workflow_runs(workflow_key, started_at DESC);

-- ---------------------------------------------------------------------------
-- Notification hub dispatches (audit of fan-out)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_core_notification_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'in_app',
  event_name TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_event_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_core_notif_user
  ON public.atlas_core_notification_dispatches(user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.atlas_core_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_core_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_core_search_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_core_analytics_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY core_outbox_select ON public.atlas_core_outbox FOR SELECT USING (true);
CREATE POLICY core_timeline_select ON public.atlas_core_timeline_events FOR SELECT USING (true);
CREATE POLICY core_search_select ON public.atlas_core_search_documents FOR SELECT USING (true);
CREATE POLICY core_analytics_select ON public.atlas_core_analytics_facts FOR SELECT USING (true);
