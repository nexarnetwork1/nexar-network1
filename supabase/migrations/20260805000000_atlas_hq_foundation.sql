-- NEXAR HQ — sole internal administration capability of ATLAS
-- Evolves legacy Admin into atlas_hq. Bootstrap + website CMS contracts + team.

-- Platform owner role (permanent founder)
DO $$ BEGIN
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'platform_owner';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Singleton bootstrap lock (executes once)
CREATE TABLE IF NOT EXISTS public.atlas_hq_bootstrap (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  completed_at timestamptz,
  platform_owner_user_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  nexar_business_id uuid,
  nexar_workspace_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.atlas_hq_bootstrap (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Permanent Platform Owner registry (never listed in Team Management)
CREATE TABLE IF NOT EXISTS public.atlas_hq_platform_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE RESTRICT,
  email text NOT NULL UNIQUE,
  is_permanent boolean NOT NULL DEFAULT true,
  must_change_password boolean NOT NULL DEFAULT true,
  must_enable_2fa boolean NOT NULL DEFAULT true,
  password_changed_at timestamptz,
  totp_enabled boolean NOT NULL DEFAULT false,
  totp_secret_encrypted text,
  first_login_at timestamptz,
  last_login_at timestamptz,
  hq_enabled boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS atlas_hq_platform_owners_user_idx
  ON public.atlas_hq_platform_owners (user_id)
  WHERE deleted_at IS NULL;

-- HQ staff (Platform Owner excluded from this table by policy/service)
CREATE TABLE IF NOT EXISTS public.atlas_hq_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  platform_role text NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled', 'invited', 'deleted')),
  custom_role_id uuid,
  invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_login_at timestamptz,
  activity_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS atlas_hq_team_members_role_idx
  ON public.atlas_hq_team_members (platform_role)
  WHERE deleted_at IS NULL AND status = 'active';

-- Custom HQ roles
CREATE TABLE IF NOT EXISTS public.atlas_hq_custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_system boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE public.atlas_hq_team_members
  DROP CONSTRAINT IF EXISTS atlas_hq_team_members_custom_role_id_fkey;
ALTER TABLE public.atlas_hq_team_members
  ADD CONSTRAINT atlas_hq_team_members_custom_role_id_fkey
  FOREIGN KEY (custom_role_id) REFERENCES public.atlas_hq_custom_roles(id) ON DELETE SET NULL;

-- Website CMS — pages
CREATE TABLE IF NOT EXISTS public.atlas_hq_website_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  page_type text NOT NULL DEFAULT 'marketing',
  path text NOT NULL,
  locale text NOT NULL DEFAULT 'en',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  seo_title text,
  seo_description text,
  seo_keywords text[],
  og_image_url text,
  canonical_url text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  published_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS atlas_hq_website_pages_path_idx
  ON public.atlas_hq_website_pages (path, locale)
  WHERE deleted_at IS NULL;

-- Website sections (hero, features, footer blocks, etc.)
CREATE TABLE IF NOT EXISTS public.atlas_hq_website_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES public.atlas_hq_website_pages(id) ON DELETE CASCADE,
  section_key text NOT NULL,
  title text,
  body jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page_id, section_key)
);

-- Global site chrome (header/footer/nav) + SEO defaults
CREATE TABLE IF NOT EXISTS public.atlas_hq_website_globals (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  header jsonb NOT NULL DEFAULT '{}'::jsonb,
  footer jsonb NOT NULL DEFAULT '{}'::jsonb,
  navigation jsonb NOT NULL DEFAULT '[]'::jsonb,
  menus jsonb NOT NULL DEFAULT '{}'::jsonb,
  default_seo jsonb NOT NULL DEFAULT '{}'::jsonb,
  languages jsonb NOT NULL DEFAULT '["en"]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.atlas_hq_website_globals (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Announcement Center (powers site announcement bar; supersedes ticker for HQ)
CREATE TABLE IF NOT EXISTS public.atlas_hq_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  button_text text,
  button_url text,
  priority int NOT NULL DEFAULT 0,
  background_color text,
  text_color text,
  icon text,
  is_enabled boolean NOT NULL DEFAULT false,
  starts_at timestamptz,
  ends_at timestamptz,
  preview_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  legacy_ticker_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS atlas_hq_announcements_active_idx
  ON public.atlas_hq_announcements (is_enabled, priority DESC, starts_at)
  WHERE deleted_at IS NULL;

-- Media library metadata
CREATE TABLE IF NOT EXISTS public.atlas_hq_media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  mime_type text,
  storage_path text NOT NULL,
  public_url text,
  alt_text text,
  folder text DEFAULT 'root',
  size_bytes bigint,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- Email templates (public / transactional marketing)
CREATE TABLE IF NOT EXISTS public.atlas_hq_email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  subject text NOT NULL,
  body_html text,
  body_text text,
  locale text NOT NULL DEFAULT 'en',
  status text NOT NULL DEFAULT 'draft',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- Soft FK notes for bootstrap business (avoid hard FK if businesses table naming differs)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'businesses'
  ) THEN
    ALTER TABLE public.atlas_hq_bootstrap
      DROP CONSTRAINT IF EXISTS atlas_hq_bootstrap_nexar_business_id_fkey;
    ALTER TABLE public.atlas_hq_bootstrap
      ADD CONSTRAINT atlas_hq_bootstrap_nexar_business_id_fkey
      FOREIGN KEY (nexar_business_id) REFERENCES public.businesses(id) ON DELETE SET NULL;
  END IF;
END $$;

COMMENT ON TABLE public.atlas_hq_bootstrap IS
  'NEXAR HQ one-time platform initialization lock';
COMMENT ON TABLE public.atlas_hq_platform_owners IS
  'Permanent Platform Owner — excluded from Team Management; cannot be demoted/deleted';
COMMENT ON TABLE public.atlas_hq_announcements IS
  'Website Announcement Center — powers announcement bar under site navigation';
