-- Nexar Network: Foundation schema
-- Phase 0 — profiles, platform settings, audit logs, private helpers

-- ─── Extensions ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Private schema (not exposed via Data API) ─────────────────────────────
CREATE SCHEMA IF NOT EXISTS private;

-- ─── Enums ─────────────────────────────────────────────────────────────────
CREATE TYPE public.user_role AS ENUM ('customer', 'merchant', 'admin');
CREATE TYPE public.store_mode AS ENUM ('marketplace', 'payments_only');
CREATE TYPE public.store_status AS ENUM ('pending', 'active', 'suspended');
CREATE TYPE public.order_status AS ENUM (
  'pending_payment', 'paid', 'expired', 'cancelled', 'refunded'
);
CREATE TYPE public.invoice_status AS ENUM (
  'draft', 'pending', 'paid', 'expired', 'cancelled'
);
CREATE TYPE public.payment_session_status AS ENUM (
  'waiting', 'paid', 'expired', 'failed'
);
CREATE TYPE public.payment_method AS ENUM ('crypto', 'card');
CREATE TYPE public.settlement_status AS ENUM (
  'pending', 'processing', 'completed', 'failed'
);
CREATE TYPE public.transfer_type AS ENUM ('platform_fee', 'merchant_payout');

-- ─── Profiles ──────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  role          public.user_role NOT NULL DEFAULT 'customer',
  wallet_address TEXT,
  profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- ─── Platform Settings (singleton) ─────────────────────────────────────────
CREATE TABLE public.platform_settings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treasury_wallet_address TEXT,
  nxr_token_address       TEXT,
  usdt_token_address      TEXT,
  support_email           TEXT NOT NULL DEFAULT 'admin@nexarnetwork.org',
  card_provider           TEXT NOT NULL DEFAULT 'stripe',
  card_platform_fee_percent NUMERIC(5,4) DEFAULT 0.029,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by              UUID REFERENCES public.profiles(id)
);

-- ─── Fee Schedules ───────────────────────────────────────────────────────────
CREATE TABLE public.fee_schedules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_type    TEXT NOT NULL CHECK (payment_type IN ('nxr', 'crypto_other', 'card')),
  base_rate       NUMERIC(5,4) NOT NULL,
  effective_from  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Audit Logs (append-only) ───────────────────────────────────────────────
CREATE TABLE public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role  public.user_role,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  metadata    JSONB DEFAULT '{}',
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id, created_at DESC);

-- ─── Updated-at trigger ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION private.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- ─── Auto-create profile on signup ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();

-- ─── Audit log helper ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION private.write_audit_log(
  p_actor_id    UUID,
  p_actor_role  public.user_role,
  p_action      TEXT,
  p_entity_type TEXT,
  p_entity_id   UUID DEFAULT NULL,
  p_metadata    JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  VALUES (p_actor_id, p_actor_role, p_action, p_entity_type, p_entity_id, p_metadata)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ─── Seed platform defaults ──────────────────────────────────────────────────
INSERT INTO public.platform_settings (
  treasury_wallet_address,
  nxr_token_address,
  usdt_token_address
) VALUES (
  NULL,  -- configured via admin UI, never hardcoded
  '0x3c7c9eeA8826e5bcB4ed2b798123915Cd596c909',
  '0x55d398326f99059fF775485246099027B3197955'
);

INSERT INTO public.fee_schedules (payment_type, base_rate) VALUES
  ('nxr', 0.0350),
  ('crypto_other', 0.0500),
  ('card', 0.0290);

-- ─── Row Level Security ──────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper: current user role
CREATE OR REPLACE FUNCTION private.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (private.current_user_role() = 'admin');

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (private.current_user_role() = 'admin');

-- Platform settings: admin read only
CREATE POLICY "Admins can read platform settings"
  ON public.platform_settings FOR SELECT
  USING (private.current_user_role() = 'admin');

CREATE POLICY "Admins can update platform settings"
  ON public.platform_settings FOR UPDATE
  USING (private.current_user_role() = 'admin');

-- Fee schedules: admin read only
CREATE POLICY "Admins can read fee schedules"
  ON public.fee_schedules FOR SELECT
  USING (private.current_user_role() = 'admin');

CREATE POLICY "Admins can manage fee schedules"
  ON public.fee_schedules FOR ALL
  USING (private.current_user_role() = 'admin');

-- Audit logs: admin read; merchants read own store-related (future); append via service role
CREATE POLICY "Admins can read audit logs"
  ON public.audit_logs FOR SELECT
  USING (private.current_user_role() = 'admin');

-- Revoke direct access to private schema from API roles
REVOKE ALL ON SCHEMA private FROM anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;
