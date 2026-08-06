-- Phase 12 — Production readiness: RLS hardening for NEXAR HQ + Core spine
-- Deny-by-default for HQ; service-role / authenticated platform roles only.

-- Feature flags / maintenance / global HQ settings
CREATE TABLE IF NOT EXISTS public.atlas_hq_feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.atlas_hq_platform_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  maintenance_mode boolean NOT NULL DEFAULT false,
  maintenance_message text,
  feature_flags jsonb NOT NULL DEFAULT '{}'::jsonb,
  seo_defaults jsonb NOT NULL DEFAULT '{}'::jsonb,
  analytics jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.atlas_hq_platform_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.atlas_hq_feature_flags (key, enabled, description)
VALUES
  ('marketplace', true, 'Public marketplace'),
  ('presale', true, 'NXR presale surfaces'),
  ('maintenance_banner', false, 'Show maintenance banner'),
  ('hq_cms_public', false, 'Serve public pages from HQ CMS')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS on HQ tables
ALTER TABLE public.atlas_hq_bootstrap ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_hq_platform_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_hq_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_hq_custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_hq_website_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_hq_website_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_hq_website_globals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_hq_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_hq_media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_hq_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_hq_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_hq_platform_settings ENABLE ROW LEVEL SECURITY;

-- Helper: platform administration roles (extends legacy admin check)
CREATE OR REPLACE FUNCTION private.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    private.current_user_role() IN (
      'admin'::public.user_role,
      'super_admin'::public.user_role,
      'platform_owner'::public.user_role
    ),
    false
  );
$$;

-- HQ: no anon access; authenticated platform admins can read/write via RLS
-- (App primarily uses service role; policies harden PostgREST exposure.)

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'atlas_hq_bootstrap',
    'atlas_hq_platform_owners',
    'atlas_hq_team_members',
    'atlas_hq_custom_roles',
    'atlas_hq_website_pages',
    'atlas_hq_website_sections',
    'atlas_hq_website_globals',
    'atlas_hq_announcements',
    'atlas_hq_media_assets',
    'atlas_hq_email_templates',
    'atlas_hq_feature_flags',
    'atlas_hq_platform_settings'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS hq_admin_all ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY hq_admin_all ON public.%I FOR ALL USING (private.is_platform_admin()) WITH CHECK (private.is_platform_admin())',
      t
    );
  END LOOP;
END $$;

-- Public read for published announcements only (announcement bar)
DROP POLICY IF EXISTS hq_announcements_public_read ON public.atlas_hq_announcements;
CREATE POLICY hq_announcements_public_read
  ON public.atlas_hq_announcements
  FOR SELECT
  USING (
    is_enabled = true
    AND deleted_at IS NULL
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
  );

-- Public read for published website pages when CMS flag may be used later
DROP POLICY IF EXISTS hq_website_pages_public_read ON public.atlas_hq_website_pages;
CREATE POLICY hq_website_pages_public_read
  ON public.atlas_hq_website_pages
  FOR SELECT
  USING (status = 'published' AND deleted_at IS NULL);

-- Harden Core analytics / outbox / timeline — no open SELECT for anon
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'atlas_core_outbox'
  ) THEN
    ALTER TABLE public.atlas_core_outbox ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS core_outbox_admin ON public.atlas_core_outbox;
    CREATE POLICY core_outbox_admin ON public.atlas_core_outbox
      FOR ALL USING (private.is_platform_admin())
      WITH CHECK (private.is_platform_admin());
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'atlas_core_timeline_events'
  ) THEN
    ALTER TABLE public.atlas_core_timeline_events ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS core_timeline_admin ON public.atlas_core_timeline_events;
    CREATE POLICY core_timeline_admin ON public.atlas_core_timeline_events
      FOR ALL USING (private.is_platform_admin())
      WITH CHECK (private.is_platform_admin());
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'atlas_core_analytics_facts'
  ) THEN
    ALTER TABLE public.atlas_core_analytics_facts ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS core_analytics_admin ON public.atlas_core_analytics_facts;
    CREATE POLICY core_analytics_admin ON public.atlas_core_analytics_facts
      FOR ALL USING (private.is_platform_admin())
      WITH CHECK (private.is_platform_admin());
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'atlas_core_search_documents'
  ) THEN
    ALTER TABLE public.atlas_core_search_documents ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS core_search_public ON public.atlas_core_search_documents;
    DROP POLICY IF EXISTS core_search_admin ON public.atlas_core_search_documents;
    CREATE POLICY core_search_public ON public.atlas_core_search_documents
      FOR SELECT USING (COALESCE(is_published, true) = true);
    CREATE POLICY core_search_admin ON public.atlas_core_search_documents
      FOR ALL USING (private.is_platform_admin())
      WITH CHECK (private.is_platform_admin());
  END IF;
END $$;

-- Privileged role guard: block client escalation to platform_owner
CREATE OR REPLACE FUNCTION private.prevent_privileged_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.role IS DISTINCT FROM OLD.role
     AND NEW.role IN (
       'admin'::public.user_role,
       'super_admin'::public.user_role,
       'platform_owner'::public.user_role
     )
     AND NOT private.is_platform_admin()
  THEN
    RAISE EXCEPTION 'Cannot escalate to privileged role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_privileged_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_privileged_role_escalation
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_privileged_role_escalation();

COMMENT ON FUNCTION private.is_platform_admin() IS
  'NEXAR HQ / platform administration roles including platform_owner';
