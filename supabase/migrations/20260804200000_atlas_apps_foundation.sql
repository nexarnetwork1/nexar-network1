-- ATLAS Apps foundation (additive, backward-compatible)
-- Business Applications Platform — expandable BOS, not a fixed ERP.
-- Does NOT own Business/Product/Order masters. Apps request scoped permissions.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE public.app_category_slug AS ENUM (
  'crm', 'hr', 'finance', 'accounting', 'inventory', 'pos', 'restaurant',
  'clinic', 'hospital', 'hotel', 'manufacturing', 'booking', 'education',
  'construction', 'real_estate', 'shipping', 'logistics', 'marketing',
  'support', 'analytics', 'ai', 'developer_tools', 'other'
);

CREATE TYPE public.app_pricing_model AS ENUM (
  'free', 'one_time', 'subscription', 'freemium', 'enterprise'
);

CREATE TYPE public.app_status AS ENUM (
  'draft', 'in_review', 'published', 'suspended', 'retired'
);

CREATE TYPE public.app_install_status AS ENUM (
  'installing', 'enabled', 'disabled', 'upgrading', 'failed', 'uninstalled'
);

CREATE TYPE public.app_permission_scope AS ENUM (
  'business', 'products', 'orders', 'crm', 'finance', 'employees',
  'wallet', 'documents', 'ai', 'marketplace', 'connect', 'pulse',
  'network', 'analytics', 'settings'
);

CREATE TYPE public.app_license_type AS ENUM (
  'free', 'commercial', 'subscription', 'enterprise', 'trial'
);

CREATE TYPE public.app_developer_status AS ENUM (
  'pending', 'verified', 'suspended', 'rejected'
);

CREATE TYPE public.app_review_status AS ENUM (
  'pending', 'approved', 'rejected'
);

-- ---------------------------------------------------------------------------
-- Developers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_apps_developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  website_url TEXT,
  status public.app_developer_status NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apps_developers_user ON public.atlas_apps_developers(user_id);
CREATE INDEX IF NOT EXISTS idx_apps_developers_status ON public.atlas_apps_developers(status);

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_apps_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug public.app_category_slug NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Applications (catalog)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_apps_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES public.atlas_apps_developers(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.atlas_apps_categories(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  icon_url TEXT,
  status public.app_status NOT NULL DEFAULT 'draft',
  pricing_model public.app_pricing_model NOT NULL DEFAULT 'free',
  price NUMERIC(20, 8) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  install_count INTEGER NOT NULL DEFAULT 0,
  rating_avg REAL NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  latest_version TEXT,
  homepage_url TEXT,
  support_url TEXT,
  privacy_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_apps_applications_status
  ON public.atlas_apps_applications(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_apps_applications_category
  ON public.atlas_apps_applications(category_id);
CREATE INDEX IF NOT EXISTS idx_apps_applications_featured
  ON public.atlas_apps_applications(is_featured) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_apps_applications_fts
  ON public.atlas_apps_applications USING gin (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
  );

-- ---------------------------------------------------------------------------
-- Versions & updates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_apps_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.atlas_apps_applications(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  changelog TEXT,
  manifest JSONB NOT NULL DEFAULT '{}'::jsonb,
  min_platform_version TEXT,
  is_latest BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (application_id, version)
);

CREATE INDEX IF NOT EXISTS idx_apps_versions_app
  ON public.atlas_apps_versions(application_id, is_latest);

CREATE TABLE IF NOT EXISTS public.atlas_apps_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.atlas_apps_applications(id) ON DELETE CASCADE,
  from_version TEXT,
  to_version TEXT NOT NULL,
  release_notes TEXT,
  is_mandatory BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Declared permissions (what an app requests)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_apps_permission_defs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.atlas_apps_applications(id) ON DELETE CASCADE,
  scope public.app_permission_scope NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'read' CHECK (access_level IN ('read', 'write', 'admin')),
  reason TEXT,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (application_id, scope, access_level)
);

-- ---------------------------------------------------------------------------
-- Licenses
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_apps_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.atlas_apps_applications(id) ON DELETE CASCADE,
  license_type public.app_license_type NOT NULL DEFAULT 'free',
  terms_url TEXT,
  seat_limit INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Installs (BusinessApplication / InstalledApplication)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_apps_installs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.atlas_apps_applications(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  installed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status public.app_install_status NOT NULL DEFAULT 'installing',
  installed_version TEXT,
  previous_version TEXT,
  enabled_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,
  uninstalled_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (application_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_apps_installs_business
  ON public.atlas_apps_installs(business_id, status);
CREATE INDEX IF NOT EXISTS idx_apps_installs_app
  ON public.atlas_apps_installs(application_id);

-- ---------------------------------------------------------------------------
-- Granted permissions per install
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_apps_install_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  install_id UUID NOT NULL REFERENCES public.atlas_apps_installs(id) ON DELETE CASCADE,
  scope public.app_permission_scope NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'read',
  granted BOOLEAN NOT NULL DEFAULT TRUE,
  granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (install_id, scope, access_level)
);

-- ---------------------------------------------------------------------------
-- Per-install settings & storage namespace
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_apps_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  install_id UUID NOT NULL UNIQUE REFERENCES public.atlas_apps_installs(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  storage JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Subscriptions (monetization)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_apps_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  install_id UUID NOT NULL REFERENCES public.atlas_apps_installs(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.atlas_apps_applications(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'default',
  status TEXT NOT NULL DEFAULT 'active',
  amount NUMERIC(20, 8) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apps_subscriptions_business
  ON public.atlas_apps_subscriptions(business_id);

-- ---------------------------------------------------------------------------
-- Reviews & ratings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_apps_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.atlas_apps_applications(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  status public.app_review_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (application_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_apps_reviews_app
  ON public.atlas_apps_reviews(application_id, status);

-- ---------------------------------------------------------------------------
-- Webhooks (app → platform / platform → app)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_apps_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.atlas_apps_applications(id) ON DELETE CASCADE,
  install_id UUID REFERENCES public.atlas_apps_installs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- API keys (developer / install scoped) — secrets hashed at rest later
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_apps_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.atlas_apps_applications(id) ON DELETE CASCADE,
  install_id UUID REFERENCES public.atlas_apps_installs(id) ON DELETE CASCADE,
  developer_id UUID REFERENCES public.atlas_apps_developers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Audit logs (security)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_apps_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.atlas_apps_applications(id) ON DELETE SET NULL,
  install_id UUID REFERENCES public.atlas_apps_installs(id) ON DELETE SET NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apps_audit_business
  ON public.atlas_apps_audit_logs(business_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Developer earnings ledger
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_apps_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES public.atlas_apps_developers(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.atlas_apps_applications(id) ON DELETE SET NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  amount NUMERIC(20, 8) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  kind TEXT NOT NULL DEFAULT 'sale',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Seed categories + system apps
-- ---------------------------------------------------------------------------
INSERT INTO public.atlas_apps_categories (slug, name, description, sort_order) VALUES
  ('crm', 'CRM', 'Customer relationship management', 10),
  ('hr', 'HR', 'People and hiring', 20),
  ('finance', 'Finance', 'Finance operations', 30),
  ('accounting', 'Accounting', 'Books and ledgers', 40),
  ('inventory', 'Inventory', 'Stock and warehouses', 50),
  ('pos', 'POS', 'Point of sale', 60),
  ('restaurant', 'Restaurant', 'F&B operations', 70),
  ('clinic', 'Clinic', 'Clinic management', 80),
  ('hospital', 'Hospital', 'Hospital operations', 90),
  ('hotel', 'Hotel', 'Hospitality', 100),
  ('manufacturing', 'Manufacturing', 'Production', 110),
  ('booking', 'Booking', 'Appointments and reservations', 120),
  ('education', 'Education', 'Schools and courses', 130),
  ('construction', 'Construction', 'Projects and sites', 140),
  ('real_estate', 'Real Estate', 'Property management', 150),
  ('shipping', 'Shipping', 'Shipments', 160),
  ('logistics', 'Logistics', 'Fleet and logistics', 170),
  ('marketing', 'Marketing', 'Campaigns and growth', 180),
  ('support', 'Support', 'Customer support', 190),
  ('analytics', 'Analytics', 'Business analytics', 200),
  ('ai', 'AI', 'AI extensions', 210),
  ('developer_tools', 'Developer Tools', 'APIs and tooling', 220),
  ('other', 'Other', 'Uncategorized', 999)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.atlas_apps_developers (display_name, slug, status, verified_at)
VALUES ('NEXAR NETWORK', 'nexar', 'verified', NOW())
ON CONFLICT (slug) DO NOTHING;

DO $$
DECLARE
  nexar_id UUID;
  cat_crm UUID; cat_hr UUID; cat_fin UUID; cat_inv UUID; cat_pos UUID;
  cat_mkt UUID; cat_sup UUID; cat_an UUID; cat_ai UUID; cat_acc UUID;
BEGIN
  SELECT id INTO nexar_id FROM public.atlas_apps_developers WHERE slug = 'nexar';
  SELECT id INTO cat_crm FROM public.atlas_apps_categories WHERE slug = 'crm';
  SELECT id INTO cat_hr FROM public.atlas_apps_categories WHERE slug = 'hr';
  SELECT id INTO cat_fin FROM public.atlas_apps_categories WHERE slug = 'finance';
  SELECT id INTO cat_acc FROM public.atlas_apps_categories WHERE slug = 'accounting';
  SELECT id INTO cat_inv FROM public.atlas_apps_categories WHERE slug = 'inventory';
  SELECT id INTO cat_pos FROM public.atlas_apps_categories WHERE slug = 'pos';
  SELECT id INTO cat_mkt FROM public.atlas_apps_categories WHERE slug = 'marketing';
  SELECT id INTO cat_sup FROM public.atlas_apps_categories WHERE slug = 'support';
  SELECT id INTO cat_an FROM public.atlas_apps_categories WHERE slug = 'analytics';
  SELECT id INTO cat_ai FROM public.atlas_apps_categories WHERE slug = 'ai';

  INSERT INTO public.atlas_apps_applications (
    developer_id, category_id, slug, name, tagline, description, status,
    pricing_model, is_system, is_featured, is_verified, latest_version, published_at
  ) VALUES
    (nexar_id, cat_crm, 'atlas-crm', 'ATLAS CRM', 'Customers & pipeline', 'Native CRM capability for ATLAS businesses', 'published', 'free', TRUE, TRUE, TRUE, '1.0.0', NOW()),
    (nexar_id, cat_hr, 'atlas-hr', 'ATLAS HR', 'People ops', 'HR and employee workflows', 'published', 'free', TRUE, TRUE, TRUE, '1.0.0', NOW()),
    (nexar_id, cat_fin, 'atlas-finance', 'ATLAS Finance', 'Money in motion', 'Finance operations on ATLAS', 'published', 'free', TRUE, TRUE, TRUE, '1.0.0', NOW()),
    (nexar_id, cat_acc, 'atlas-accounting', 'ATLAS Accounting', 'Books & reports', 'Accounting foundation app', 'published', 'freemium', TRUE, FALSE, TRUE, '1.0.0', NOW()),
    (nexar_id, cat_inv, 'atlas-inventory', 'ATLAS Inventory', 'Stock truth', 'Inventory management', 'published', 'free', TRUE, TRUE, TRUE, '1.0.0', NOW()),
    (nexar_id, cat_pos, 'atlas-pos', 'ATLAS POS', 'Sell in person', 'Point of sale', 'published', 'subscription', TRUE, FALSE, TRUE, '1.0.0', NOW()),
    (nexar_id, cat_mkt, 'atlas-marketing', 'ATLAS Marketing', 'Campaigns', 'Marketing automation', 'published', 'freemium', TRUE, FALSE, TRUE, '1.0.0', NOW()),
    (nexar_id, cat_sup, 'atlas-support', 'ATLAS Support', 'Help desk', 'Customer support desk', 'published', 'free', TRUE, FALSE, TRUE, '1.0.0', NOW()),
    (nexar_id, cat_an, 'atlas-analytics-plus', 'ATLAS Analytics+', 'Deeper KPIs', 'Advanced analytics pack', 'published', 'subscription', TRUE, TRUE, TRUE, '1.0.0', NOW()),
    (nexar_id, cat_ai, 'atlas-ai-pack', 'ATLAS AI Pack', 'AI extensions', 'Extra AI automations for modules', 'published', 'subscription', TRUE, TRUE, TRUE, '1.0.0', NOW())
  ON CONFLICT (slug) DO NOTHING;
END $$;

-- Permission defs for system CRM app
INSERT INTO public.atlas_apps_permission_defs (application_id, scope, access_level, reason)
SELECT a.id, s.scope, s.access_level, s.reason
FROM public.atlas_apps_applications a
CROSS JOIN (VALUES
  ('crm'::public.app_permission_scope, 'write', 'Manage customers and pipeline'),
  ('business'::public.app_permission_scope, 'read', 'Read business profile'),
  ('orders'::public.app_permission_scope, 'read', 'Link orders to customers')
) AS s(scope, access_level, reason)
WHERE a.slug = 'atlas-crm'
ON CONFLICT DO NOTHING;

-- Versions for system apps
INSERT INTO public.atlas_apps_versions (application_id, version, changelog, manifest, is_latest, published_at)
SELECT id, '1.0.0', 'Initial release', jsonb_build_object('pluginApi', '1.0', 'entry', 'index'), TRUE, NOW()
FROM public.atlas_apps_applications
WHERE is_system = TRUE
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Auto-provision: nothing mandatory installed — empty install set is valid.
-- Optional: ensure NEXAR developer exists (already seeded).
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.atlas_apps_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_apps_installs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_apps_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_apps_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_apps_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_apps_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_apps_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published apps" ON public.atlas_apps_applications
  FOR SELECT USING (
    (status = 'published' AND deleted_at IS NULL)
    OR private.current_user_role() = 'admin'::public.user_role
  );

CREATE POLICY "Members read business installs" ON public.atlas_apps_installs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.business_id = atlas_apps_installs.business_id
        AND bm.user_id = auth.uid()
        AND bm.revoked_at IS NULL
        AND bm.status = 'active'::public.business_member_status
    )
    OR EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = atlas_apps_installs.business_id AND b.owner_user_id = auth.uid()
    )
    OR private.current_user_role() = 'admin'::public.user_role
  );

CREATE POLICY "Public read approved reviews" ON public.atlas_apps_reviews
  FOR SELECT USING (
    status = 'approved'
    OR user_id = auth.uid()
    OR private.current_user_role() = 'admin'::public.user_role
  );
