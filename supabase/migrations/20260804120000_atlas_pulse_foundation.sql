-- ATLAS Pulse foundation (additive, backward-compatible)
-- Business Intelligence Feed — real-time activity engine.
-- Does NOT modify atlas_network, business_hub, or commerce tables.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE public.pulse_feed_scope AS ENUM (
  'platform', 'business', 'user', 'industry', 'following'
);

CREATE TYPE public.pulse_item_type AS ENUM (
  'text', 'image', 'video', 'pdf', 'article', 'product', 'service',
  'marketplace_listing', 'job', 'investment', 'announcement', 'event',
  'poll', 'business_update', 'ai_insight', 'milestone', 'promotion',
  'partnership', 'employee', 'verification', 'marketplace_sale'
);

CREATE TYPE public.pulse_item_source AS ENUM (
  'business_hub', 'atlas_network', 'marketplace', 'catalog', 'orders',
  'payments', 'ai', 'atlas_pulse', 'admin', 'external'
);

CREATE TYPE public.pulse_reaction_type AS ENUM (
  'like', 'celebrate', 'support', 'insightful', 'interesting', 'love'
);

CREATE TYPE public.pulse_article_category AS ENUM (
  'technology', 'ai', 'marketing', 'finance', 'logistics', 'leadership',
  'sales', 'startups', 'business_strategy', 'general'
);

CREATE TYPE public.pulse_trending_entity_type AS ENUM (
  'business', 'product', 'service', 'job', 'event', 'article',
  'industry', 'technology', 'hashtag', 'topic'
);

CREATE TYPE public.pulse_collection_type AS ENUM (
  'general', 'business', 'research', 'products', 'services', 'articles'
);

CREATE TYPE public.pulse_sponsor_type AS ENUM (
  'post', 'company', 'product', 'service', 'event', 'article'
);

-- ---------------------------------------------------------------------------
-- Feeds & timelines
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_pulse_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope public.pulse_feed_scope NOT NULL DEFAULT 'business',
  owner_id UUID,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (scope, owner_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_pulse_feeds_business ON public.atlas_pulse_feeds(business_id);
CREATE INDEX IF NOT EXISTS idx_pulse_feeds_scope ON public.atlas_pulse_feeds(scope);

CREATE TABLE IF NOT EXISTS public.atlas_pulse_timelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  feed_id UUID NOT NULL UNIQUE REFERENCES public.atlas_pulse_feeds(id) ON DELETE CASCADE,
  item_count INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Feed items (normalized intelligence layer — ingested from all sources)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_pulse_feed_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID NOT NULL REFERENCES public.atlas_pulse_feeds(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  item_type public.pulse_item_type NOT NULL,
  source public.pulse_item_source NOT NULL,
  source_event TEXT,
  source_entity_type TEXT,
  source_entity_id UUID,
  title TEXT,
  summary TEXT,
  body TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  visibility TEXT NOT NULL DEFAULT 'public',
  trending_score NUMERIC NOT NULL DEFAULT 0,
  engagement_score NUMERIC NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  reaction_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  share_count INTEGER NOT NULL DEFAULT 0,
  bookmark_count INTEGER NOT NULL DEFAULT 0,
  is_sponsored BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pulse_items_feed ON public.atlas_pulse_feed_items(feed_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_pulse_items_business ON public.atlas_pulse_feed_items(business_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_pulse_items_type ON public.atlas_pulse_feed_items(item_type);
CREATE INDEX IF NOT EXISTS idx_pulse_items_trending ON public.atlas_pulse_feed_items(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_pulse_items_source ON public.atlas_pulse_feed_items(source, source_entity_id);

-- ---------------------------------------------------------------------------
-- Activities (immutable event log for Pulse)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_pulse_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  source public.pulse_item_source NOT NULL,
  source_event TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  feed_item_id UUID REFERENCES public.atlas_pulse_feed_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pulse_activities_business ON public.atlas_pulse_activities(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pulse_activities_type ON public.atlas_pulse_activities(activity_type);

-- ---------------------------------------------------------------------------
-- Rich content extensions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_pulse_business_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id UUID NOT NULL UNIQUE REFERENCES public.atlas_pulse_feed_items(id) ON DELETE CASCADE,
  update_kind TEXT NOT NULL DEFAULT 'general',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.atlas_pulse_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id UUID NOT NULL UNIQUE REFERENCES public.atlas_pulse_feed_items(id) ON DELETE CASCADE,
  level TEXT NOT NULL DEFAULT 'info',
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.atlas_pulse_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id UUID NOT NULL UNIQUE REFERENCES public.atlas_pulse_feed_items(id) ON DELETE CASCADE,
  category public.pulse_article_category NOT NULL DEFAULT 'general',
  body_html TEXT,
  read_time_minutes INTEGER,
  author_profile_id UUID
);

CREATE TABLE IF NOT EXISTS public.atlas_pulse_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id UUID NOT NULL UNIQUE REFERENCES public.atlas_pulse_feed_items(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL DEFAULT 'daily_summary',
  generated_by TEXT NOT NULL DEFAULT 'atlas_ai',
  confidence NUMERIC,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ---------------------------------------------------------------------------
-- Trending engine
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_pulse_trending_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  entity_type public.pulse_trending_entity_type NOT NULL DEFAULT 'topic',
  score NUMERIC NOT NULL DEFAULT 0,
  post_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_end TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.atlas_pulse_trending_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL DEFAULT 0,
  rank INTEGER,
  industry TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, window_start)
);

CREATE TABLE IF NOT EXISTS public.atlas_pulse_trending_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  score NUMERIC NOT NULL DEFAULT 0,
  rank INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pulse_trending_products_score ON public.atlas_pulse_trending_products(score DESC);

CREATE TABLE IF NOT EXISTS public.atlas_pulse_trending_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_ref TEXT NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  score NUMERIC NOT NULL DEFAULT 0,
  rank INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.atlas_pulse_hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  post_count INTEGER NOT NULL DEFAULT 0,
  trending_score NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.atlas_pulse_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id UUID NOT NULL REFERENCES public.atlas_pulse_feed_items(id) ON DELETE CASCADE,
  mentioned_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  mentioned_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Engagement on Pulse feed items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_pulse_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id UUID NOT NULL REFERENCES public.atlas_pulse_feed_items(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type public.pulse_reaction_type NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (feed_item_id, actor_user_id)
);

CREATE TABLE IF NOT EXISTS public.atlas_pulse_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id UUID NOT NULL REFERENCES public.atlas_pulse_feed_items(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.atlas_pulse_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  depth INTEGER NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pulse_comments_item ON public.atlas_pulse_comments(feed_item_id);

CREATE TABLE IF NOT EXISTS public.atlas_pulse_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id UUID NOT NULL REFERENCES public.atlas_pulse_feed_items(id) ON DELETE CASCADE,
  sharer_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  share_type TEXT NOT NULL DEFAULT 'repost',
  quote_body TEXT,
  target_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Bookmarks & collections
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_pulse_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  collection_type public.pulse_collection_type NOT NULL DEFAULT 'general',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.atlas_pulse_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feed_item_id UUID NOT NULL REFERENCES public.atlas_pulse_feed_items(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES public.atlas_pulse_collections(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, feed_item_id)
);

-- ---------------------------------------------------------------------------
-- Recommendations & preferences
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_pulse_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  recommended_entity_type TEXT NOT NULL,
  recommended_entity_id UUID NOT NULL,
  score NUMERIC NOT NULL DEFAULT 0,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pulse_recommendations_target ON public.atlas_pulse_recommendations(target_user_id, score DESC);

CREATE TABLE IF NOT EXISTS public.atlas_pulse_feed_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  muted_business_ids UUID[] NOT NULL DEFAULT '{}',
  muted_hashtags TEXT[] NOT NULL DEFAULT '{}',
  ai_recommendations_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.atlas_pulse_feed_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO public.atlas_pulse_feed_categories (slug, label, sort_order) VALUES
  ('all', 'All', 0),
  ('business_updates', 'Business Updates', 1),
  ('products', 'Products', 2),
  ('marketplace', 'Marketplace', 3),
  ('jobs', 'Jobs', 4),
  ('events', 'Events', 5),
  ('articles', 'Articles', 6),
  ('ai_insights', 'AI Insights', 7)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Analytics & sponsored (monetization-ready)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_pulse_item_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id UUID NOT NULL UNIQUE REFERENCES public.atlas_pulse_feed_items(id) ON DELETE CASCADE,
  views INTEGER NOT NULL DEFAULT 0,
  reach INTEGER NOT NULL DEFAULT 0,
  engagements INTEGER NOT NULL DEFAULT 0,
  ctr NUMERIC NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  bookmarks INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.atlas_pulse_sponsored_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id UUID NOT NULL UNIQUE REFERENCES public.atlas_pulse_feed_items(id) ON DELETE CASCADE,
  sponsor_type public.pulse_sponsor_type NOT NULL,
  sponsor_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  budget NUMERIC,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ---------------------------------------------------------------------------
-- Auto-provision Pulse feed + timeline when Business is created
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.ensure_atlas_pulse_for_business()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fid UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM public.atlas_pulse_timelines WHERE business_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.atlas_pulse_feeds (scope, owner_id, business_id, title)
  VALUES ('business'::public.pulse_feed_scope, NEW.owner_user_id, NEW.id, NEW.display_name || ' Pulse')
  RETURNING id INTO fid;

  INSERT INTO public.atlas_pulse_timelines (business_id, feed_id)
  VALUES (NEW.id, fid);

  INSERT INTO public.atlas_pulse_feed_items (
    feed_id, business_id, actor_user_id, item_type, source, source_event,
    title, summary, payload
  ) VALUES (
    fid, NEW.id, NEW.owner_user_id, 'business_update'::public.pulse_item_type,
    'business_hub'::public.pulse_item_source, 'business.created',
    'Business joined ATLAS', NEW.display_name || ' is now on ATLAS Pulse',
    jsonb_build_object('businessId', NEW.id, 'slug', NEW.slug)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS businesses_ensure_pulse ON public.businesses;
CREATE TRIGGER businesses_ensure_pulse
  AFTER INSERT ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION private.ensure_atlas_pulse_for_business();

-- Platform-wide discovery feed
INSERT INTO public.atlas_pulse_feeds (scope, title, metadata)
SELECT 'platform'::public.pulse_feed_scope, 'ATLAS Pulse', '{"source":"bootstrap"}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.atlas_pulse_feeds WHERE scope = 'platform'::public.pulse_feed_scope AND owner_id IS NULL
);

-- Backfill timelines for existing businesses
DO $$
DECLARE r RECORD; fid UUID;
BEGIN
  FOR r IN SELECT * FROM public.businesses WHERE deleted_at IS NULL LOOP
    IF EXISTS (SELECT 1 FROM public.atlas_pulse_timelines WHERE business_id = r.id) THEN
      CONTINUE;
    END IF;
    INSERT INTO public.atlas_pulse_feeds (scope, owner_id, business_id, title)
    VALUES ('business'::public.pulse_feed_scope, r.owner_user_id, r.id, r.display_name || ' Pulse')
    RETURNING id INTO fid;
    INSERT INTO public.atlas_pulse_timelines (business_id, feed_id) VALUES (r.id, fid);
  END LOOP;
END $$;

-- RLS
ALTER TABLE public.atlas_pulse_feed_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read pulse items" ON public.atlas_pulse_feed_items
  FOR SELECT USING (
    visibility = 'public'
    OR private.current_user_role() = 'admin'::public.user_role
  );
