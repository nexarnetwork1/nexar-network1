-- ATLAS Network foundation (additive, backward-compatible)
-- Business Social Network — second pillar of ATLAS.
-- Does NOT modify existing business_hub or commerce tables.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE public.network_profile_subject_type AS ENUM (
  'user', 'business', 'organization', 'page', 'community', 'event', 'group'
);

CREATE TYPE public.network_profile_kind AS ENUM (
  'business', 'employee', 'founder', 'investor', 'partner',
  'supplier', 'customer', 'creator', 'developer'
);

CREATE TYPE public.network_privacy_level AS ENUM (
  'public', 'followers', 'connections', 'private', 'organization_only'
);

CREATE TYPE public.network_connection_kind AS ENUM (
  'business_business', 'business_employee', 'investor_startup',
  'supplier_merchant', 'partner_partner', 'professional'
);

CREATE TYPE public.network_connection_status AS ENUM (
  'pending', 'accepted', 'declined', 'blocked', 'revoked'
);

CREATE TYPE public.network_follow_target_type AS ENUM (
  'profile', 'business', 'page', 'community', 'event'
);

CREATE TYPE public.network_post_type AS ENUM (
  'text', 'image', 'video', 'pdf', 'carousel', 'product', 'service',
  'poll', 'job', 'event', 'announcement', 'article'
);

CREATE TYPE public.network_post_visibility AS ENUM (
  'public', 'followers', 'connections', 'private', 'organization_only'
);

CREATE TYPE public.network_reaction_type AS ENUM (
  'like', 'celebrate', 'insightful', 'support', 'interesting', 'love'
);

CREATE TYPE public.network_share_type AS ENUM (
  'share', 'repost', 'quote'
);

CREATE TYPE public.network_conversation_type AS ENUM (
  'direct', 'business', 'team', 'group'
);

CREATE TYPE public.network_message_type AS ENUM (
  'text', 'media', 'file', 'voice', 'video', 'quote', 'invoice', 'payment'
);

CREATE TYPE public.network_activity_type AS ENUM (
  'post_created', 'product_created', 'partner_added', 'employee_hired',
  'store_created', 'event_created', 'job_posted', 'investment_made',
  'connection_accepted', 'follow', 'share', 'reaction', 'comment'
);

CREATE TYPE public.network_community_role AS ENUM (
  'owner', 'admin', 'moderator', 'member'
);

CREATE TYPE public.network_report_reason AS ENUM (
  'spam', 'harassment', 'misinformation', 'ip_violation', 'other'
);

-- ---------------------------------------------------------------------------
-- Profiles (root entity — person or entity face on the network)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_network_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type public.network_profile_subject_type NOT NULL,
  subject_id UUID NOT NULL,
  profile_kind public.network_profile_kind NOT NULL DEFAULT 'business',
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  headline TEXT,
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  privacy public.network_privacy_level NOT NULL DEFAULT 'public',
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  follower_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER NOT NULL DEFAULT 0,
  owner_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  profile_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (subject_type, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_an_profiles_owner ON public.atlas_network_profiles(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_an_profiles_business ON public.atlas_network_profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_an_profiles_kind ON public.atlas_network_profiles(profile_kind);
CREATE INDEX IF NOT EXISTS idx_an_profiles_deleted ON public.atlas_network_profiles(deleted_at);

-- ---------------------------------------------------------------------------
-- Company profile (1:1 with Business — network-facing company page)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_network_company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  network_profile_id UUID NOT NULL UNIQUE REFERENCES public.atlas_network_profiles(id) ON DELETE CASCADE,
  industry TEXT,
  location TEXT,
  website TEXT,
  showcase JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_an_company_profiles_business ON public.atlas_network_company_profiles(business_id);

-- ---------------------------------------------------------------------------
-- Person profile (1:1 with user — professional, not lifestyle)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_network_person_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  network_profile_id UUID NOT NULL UNIQUE REFERENCES public.atlas_network_profiles(id) ON DELETE CASCADE,
  experience JSONB NOT NULL DEFAULT '[]'::jsonb,
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  education JSONB NOT NULL DEFAULT '[]'::jsonb,
  certificates JSONB NOT NULL DEFAULT '[]'::jsonb,
  projects JSONB NOT NULL DEFAULT '[]'::jsonb,
  portfolio JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_position JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Organization (optional umbrella above businesses)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_network_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_profile_id UUID NOT NULL UNIQUE REFERENCES public.atlas_network_profiles(id) ON DELETE CASCADE,
  parent_org_id UUID REFERENCES public.atlas_network_organizations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  org_type TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- Social graph
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_network_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_profile_id UUID NOT NULL REFERENCES public.atlas_network_profiles(id) ON DELETE CASCADE,
  target_type public.network_follow_target_type NOT NULL,
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (follower_profile_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_an_follows_target ON public.atlas_network_follows(target_type, target_id);

CREATE TABLE IF NOT EXISTS public.atlas_network_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_profile_id UUID NOT NULL REFERENCES public.atlas_network_profiles(id) ON DELETE CASCADE,
  recipient_profile_id UUID NOT NULL REFERENCES public.atlas_network_profiles(id) ON DELETE CASCADE,
  connection_kind public.network_connection_kind NOT NULL DEFAULT 'professional',
  status public.network_connection_status NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE (requester_profile_id, recipient_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_an_connections_recipient ON public.atlas_network_connections(recipient_profile_id, status);

-- ---------------------------------------------------------------------------
-- Content — posts (articles & announcements use post_type)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_network_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_profile_id UUID NOT NULL REFERENCES public.atlas_network_profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  post_type public.network_post_type NOT NULL DEFAULT 'text',
  title TEXT,
  body TEXT,
  visibility public.network_post_visibility NOT NULL DEFAULT 'public',
  article_body_html TEXT,
  announcement_level TEXT,
  reaction_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  comment_count INTEGER NOT NULL DEFAULT 0,
  share_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_an_posts_author ON public.atlas_network_posts(author_profile_id);
CREATE INDEX IF NOT EXISTS idx_an_posts_business ON public.atlas_network_posts(business_id);
CREATE INDEX IF NOT EXISTS idx_an_posts_published ON public.atlas_network_posts(published_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS public.atlas_network_post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.atlas_network_posts(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.atlas_network_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.atlas_network_posts(id) ON DELETE CASCADE,
  author_profile_id UUID NOT NULL REFERENCES public.atlas_network_profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.atlas_network_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  depth INTEGER NOT NULL DEFAULT 0,
  mention_ids UUID[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_an_comments_post ON public.atlas_network_comments(post_id);

CREATE TABLE IF NOT EXISTS public.atlas_network_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.atlas_network_profiles(id) ON DELETE CASCADE,
  reaction_type public.network_reaction_type NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (target_type, target_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.atlas_network_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_post_id UUID NOT NULL REFERENCES public.atlas_network_posts(id) ON DELETE CASCADE,
  sharer_profile_id UUID NOT NULL REFERENCES public.atlas_network_profiles(id) ON DELETE CASCADE,
  share_type public.network_share_type NOT NULL DEFAULT 'share',
  quote_body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.atlas_network_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.atlas_network_profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.atlas_network_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id, post_id)
);

-- ---------------------------------------------------------------------------
-- Tags & hashtags
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_network_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.atlas_network_hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  post_count INTEGER NOT NULL DEFAULT 0,
  trending_score NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.atlas_network_post_tags (
  post_id UUID NOT NULL REFERENCES public.atlas_network_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.atlas_network_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.atlas_network_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.atlas_network_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.atlas_network_comments(id) ON DELETE CASCADE,
  mentioned_profile_id UUID NOT NULL REFERENCES public.atlas_network_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Communities, pages, groups
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_network_communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_profile_id UUID NOT NULL UNIQUE REFERENCES public.atlas_network_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  privacy public.network_privacy_level NOT NULL DEFAULT 'public',
  member_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.atlas_network_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_profile_id UUID NOT NULL UNIQUE REFERENCES public.atlas_network_profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  page_type TEXT NOT NULL DEFAULT 'company',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_an_pages_business ON public.atlas_network_pages(business_id);

CREATE TABLE IF NOT EXISTS public.atlas_network_community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.atlas_network_communities(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.atlas_network_profiles(id) ON DELETE CASCADE,
  role public.network_community_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (community_id, profile_id)
);

-- ---------------------------------------------------------------------------
-- Events, jobs, polls (foundation — linked to posts when published)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_network_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_profile_id UUID NOT NULL REFERENCES public.atlas_network_profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.atlas_network_posts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  location TEXT,
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.atlas_network_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL UNIQUE REFERENCES public.atlas_network_posts(id) ON DELETE CASCADE,
  ends_at TIMESTAMPTZ,
  allow_multiple BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.atlas_network_poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.atlas_network_polls(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  vote_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.atlas_network_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.atlas_network_polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.atlas_network_poll_options(id) ON DELETE CASCADE,
  voter_profile_id UUID NOT NULL REFERENCES public.atlas_network_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (poll_id, voter_profile_id)
);

-- ---------------------------------------------------------------------------
-- Messaging (Atlas Chat foundation)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_network_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_type public.network_conversation_type NOT NULL DEFAULT 'direct',
  title TEXT,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.atlas_network_conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.atlas_network_conversations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.atlas_network_profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  UNIQUE (conversation_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.atlas_network_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.atlas_network_conversations(id) ON DELETE CASCADE,
  sender_profile_id UUID NOT NULL REFERENCES public.atlas_network_profiles(id) ON DELETE CASCADE,
  message_type public.network_message_type NOT NULL DEFAULT 'text',
  body TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_an_messages_conversation ON public.atlas_network_messages(conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.atlas_network_message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.atlas_network_messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  mime_type TEXT,
  file_size BIGINT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Activity & timeline (unified feed index)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_network_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type public.network_activity_type NOT NULL,
  actor_profile_id UUID REFERENCES public.atlas_network_profiles(id) ON DELETE SET NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  target_type TEXT,
  target_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_an_activities_business ON public.atlas_network_activities(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_an_activities_type ON public.atlas_network_activities(activity_type, created_at DESC);

CREATE TABLE IF NOT EXISTS public.atlas_network_timeline_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_owner_profile_id UUID NOT NULL REFERENCES public.atlas_network_profiles(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.atlas_network_activities(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.atlas_network_posts(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_an_timeline_owner ON public.atlas_network_timeline_entries(feed_owner_profile_id, score DESC, created_at DESC);

-- ---------------------------------------------------------------------------
-- Moderation
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_network_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_profile_id UUID NOT NULL REFERENCES public.atlas_network_profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason public.network_report_reason NOT NULL DEFAULT 'other',
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.atlas_network_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_profile_id UUID NOT NULL REFERENCES public.atlas_network_profiles(id) ON DELETE CASCADE,
  blocked_profile_id UUID NOT NULL REFERENCES public.atlas_network_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (blocker_profile_id, blocked_profile_id)
);

CREATE TABLE IF NOT EXISTS public.atlas_network_mutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  muter_profile_id UUID NOT NULL REFERENCES public.atlas_network_profiles(id) ON DELETE CASCADE,
  muted_profile_id UUID NOT NULL REFERENCES public.atlas_network_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (muter_profile_id, muted_profile_id)
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.set_atlas_network_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS an_profiles_updated_at ON public.atlas_network_profiles;
CREATE TRIGGER an_profiles_updated_at BEFORE UPDATE ON public.atlas_network_profiles
  FOR EACH ROW EXECUTE FUNCTION private.set_atlas_network_updated_at();

DROP TRIGGER IF EXISTS an_company_profiles_updated_at ON public.atlas_network_company_profiles;
CREATE TRIGGER an_company_profiles_updated_at BEFORE UPDATE ON public.atlas_network_company_profiles
  FOR EACH ROW EXECUTE FUNCTION private.set_atlas_network_updated_at();

DROP TRIGGER IF EXISTS an_posts_updated_at ON public.atlas_network_posts;
CREATE TRIGGER an_posts_updated_at BEFORE UPDATE ON public.atlas_network_posts
  FOR EACH ROW EXECUTE FUNCTION private.set_atlas_network_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-provision company network profile when Business is created
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.ensure_atlas_network_company_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prof_id UUID;
  page_slug TEXT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.atlas_network_company_profiles WHERE business_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  page_slug := NEW.slug || '-network';
  IF EXISTS (SELECT 1 FROM public.atlas_network_profiles WHERE slug = page_slug) THEN
    page_slug := NEW.slug || '-network-' || substr(NEW.id::text, 1, 8);
  END IF;

  INSERT INTO public.atlas_network_profiles (
    subject_type, subject_id, profile_kind, slug, display_name, headline,
    avatar_url, owner_user_id, business_id, profile_data, metadata
  ) VALUES (
    'business', NEW.id, 'business', page_slug, NEW.display_name,
    NEW.legal_name, NEW.logo_url, NEW.owner_user_id, NEW.id,
    jsonb_build_object('industry', NEW.business_type),
    jsonb_build_object('source', 'business_insert_trigger')
  )
  RETURNING id INTO prof_id;

  INSERT INTO public.atlas_network_company_profiles (
    business_id, network_profile_id, industry, website
  ) VALUES (
    NEW.id, prof_id, NEW.business_type,
    COALESCE(NEW.profile->>'website', NULL)
  );

  INSERT INTO public.atlas_network_pages (
    network_profile_id, business_id, page_type
  ) VALUES (prof_id, NEW.id, 'company');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS businesses_ensure_network_profile ON public.businesses;
CREATE TRIGGER businesses_ensure_network_profile
  AFTER INSERT ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION private.ensure_atlas_network_company_profile();

-- Backfill existing businesses
DO $$
DECLARE r RECORD; prof_id UUID; page_slug TEXT;
BEGIN
  FOR r IN SELECT * FROM public.businesses WHERE deleted_at IS NULL LOOP
    IF EXISTS (SELECT 1 FROM public.atlas_network_company_profiles WHERE business_id = r.id) THEN
      CONTINUE;
    END IF;
    page_slug := r.slug || '-network';
    IF EXISTS (SELECT 1 FROM public.atlas_network_profiles WHERE slug = page_slug) THEN
      page_slug := r.slug || '-network-' || substr(r.id::text, 1, 8);
    END IF;
    INSERT INTO public.atlas_network_profiles (
      subject_type, subject_id, profile_kind, slug, display_name, headline,
      avatar_url, owner_user_id, business_id, metadata
    ) VALUES (
      'business', r.id, 'business', page_slug, r.display_name, r.legal_name,
      r.logo_url, r.owner_user_id, r.id,
      jsonb_build_object('source', 'backfill_atlas_network')
    ) RETURNING id INTO prof_id;
    INSERT INTO public.atlas_network_company_profiles (business_id, network_profile_id, industry)
    VALUES (r.id, prof_id, r.business_type);
    INSERT INTO public.atlas_network_pages (network_profile_id, business_id, page_type)
    VALUES (prof_id, r.id, 'company');
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- RLS (service-role writes today; policies for future user-scoped reads)
-- ---------------------------------------------------------------------------
ALTER TABLE public.atlas_network_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_network_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read public network profiles" ON public.atlas_network_profiles
  FOR SELECT USING (
    privacy = 'public'::public.network_privacy_level
    OR owner_user_id = auth.uid()
    OR private.current_user_role() = 'admin'::public.user_role
  );

CREATE POLICY "Owners manage own network profiles" ON public.atlas_network_profiles
  FOR ALL USING (
    owner_user_id = auth.uid()
    OR private.current_user_role() = 'admin'::public.user_role
  );

CREATE POLICY "Public can read public posts" ON public.atlas_network_posts
  FOR SELECT USING (
    visibility = 'public'::public.network_post_visibility
    OR private.current_user_role() = 'admin'::public.user_role
  );
