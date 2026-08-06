-- NBOS Business Hub foundation (additive, backward-compatible)
-- Mirrors remote migration business_hub_foundation.
-- Does NOT drop/rename stores, products, orders, or merchant_profiles.

CREATE TYPE public.business_status AS ENUM (
  'draft', 'pending', 'active', 'suspended', 'closed'
);

CREATE TYPE public.business_verification_state AS ENUM (
  'unverified', 'pending', 'verified', 'rejected'
);

CREATE TYPE public.business_member_role AS ENUM (
  'owner', 'admin', 'manager', 'staff', 'viewer'
);

CREATE TYPE public.business_member_status AS ENUM (
  'active', 'invited', 'revoked'
);

CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  legal_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status public.business_status NOT NULL DEFAULT 'pending',
  verification_state public.business_verification_state NOT NULL DEFAULT 'unverified',
  business_type TEXT,
  logo_url TEXT,
  profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  primary_store_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_businesses_owner ON public.businesses(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON public.businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_verification ON public.businesses(verification_state);
CREATE INDEX IF NOT EXISTS idx_businesses_deleted ON public.businesses(deleted_at);

CREATE TABLE IF NOT EXISTS public.business_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.business_member_role NOT NULL DEFAULT 'staff',
  status public.business_member_status NOT NULL DEFAULT 'active',
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  UNIQUE (business_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_business_memberships_user ON public.business_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_business_memberships_business ON public.business_memberships(business_id);

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_stores_business ON public.stores(business_id);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_business ON public.products(business_id);

DO $$ BEGIN
  ALTER TABLE public.businesses
    ADD CONSTRAINT businesses_primary_store_id_fkey
    FOREIGN KEY (primary_store_id) REFERENCES public.stores(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
