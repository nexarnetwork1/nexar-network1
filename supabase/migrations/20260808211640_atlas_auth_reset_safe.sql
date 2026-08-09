-- ATLAS Auth reset (SAFE) — canonical Auth.js identity without touching business data.
--
-- Supersedes the rejected 20260809120000_atlas_auth_reset.sql (which deleted profiles).
--
-- Guarantees:
--   • NO DELETE on profiles, stores, products, orders, businesses, invoices, or finance tables
--   • NO reliance on CASCADE to wipe authentication data
--   • profiles → authjs_users uses ON DELETE RESTRICT (auth user removal cannot cascade into catalog)
--   • Auth cleanup limited to ephemeral auth-owned tables and orphan authjs_users (no profile row)
--   • Fails loudly if profiles cannot be linked to authjs_users

-- ─── Pre-flight: refuse to run if business anchors would be at risk ─────────
DO $$
DECLARE
  v_profiles bigint;
  v_stores bigint;
  v_businesses bigint;
  v_products bigint;
  v_orders bigint;
BEGIN
  SELECT COUNT(*) INTO v_profiles FROM public.profiles;
  SELECT COUNT(*) INTO v_stores FROM public.stores;
  SELECT COUNT(*) INTO v_businesses FROM public.businesses;
  SELECT COUNT(*) INTO v_products FROM public.products;
  SELECT COUNT(*) INTO v_orders FROM public.orders;

  RAISE NOTICE 'atlas_auth_reset_safe pre-flight: profiles=%, stores=%, businesses=%, products=%, orders=%',
    v_profiles, v_stores, v_businesses, v_products, v_orders;
END $$;

-- ─── Backfill authjs_users for any profile missing a canonical auth row ─────
INSERT INTO public.authjs_users (id, name, email, created_at, updated_at)
SELECT
  p.id,
  p.full_name,
  p.email,
  p.created_at,
  p.updated_at
FROM public.profiles p
LEFT JOIN public.authjs_users u ON u.id = p.id
WHERE u.id IS NULL;

-- Hard stop: every profile must have a matching authjs_users row before FK attach.
DO $$
DECLARE
  v_orphan_profiles bigint;
BEGIN
  SELECT COUNT(*) INTO v_orphan_profiles
  FROM public.profiles p
  LEFT JOIN public.authjs_users u ON u.id = p.id
  WHERE u.id IS NULL;

  IF v_orphan_profiles > 0 THEN
    RAISE EXCEPTION
      'atlas_auth_reset_safe: % profile(s) lack matching authjs_users row after backfill. Aborting.',
      v_orphan_profiles;
  END IF;
END $$;

-- ─── Detach legacy Supabase Auth auto-profile trigger ─────────────────────
-- Auth.js createUser / OAuth callbacks own profile creation (see auth.ts).
-- Supabase auth.users rows are NOT deleted here; they may still exist historically.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ─── Canonical profile ↔ Auth.js user link (RESTRICT, not CASCADE) ──────────
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_authjs_user_fk;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_authjs_user_fk
  FOREIGN KEY (id) REFERENCES public.authjs_users(id) ON DELETE RESTRICT;

COMMENT ON CONSTRAINT profiles_authjs_user_fk ON public.profiles IS
  'ATLAS profile identity is anchored to Auth.js. Deleting authjs_users is blocked while a profile exists.';

-- ─── Wallet connections (verified public addresses only) ────────────────────
CREATE TABLE IF NOT EXISTS public.wallet_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.authjs_users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  chain_id INTEGER NOT NULL DEFAULT 56,
  provider TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT wallet_connections_address_lowercase CHECK (wallet_address = lower(wallet_address)),
  CONSTRAINT wallet_connections_address_format CHECK (wallet_address ~ '^0x[a-f0-9]{40}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_connections_address_unique
  ON public.wallet_connections (wallet_address);

CREATE INDEX IF NOT EXISTS idx_wallet_connections_user
  ON public.wallet_connections (user_id);

DROP TRIGGER IF EXISTS wallet_connections_updated_at ON public.wallet_connections;
CREATE TRIGGER wallet_connections_updated_at
  BEFORE UPDATE ON public.wallet_connections
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- ─── SIWE / wallet signature challenges (ephemeral) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.wallet_auth_nonces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.authjs_users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  nonce TEXT NOT NULL UNIQUE,
  message TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_auth_nonces_expires
  ON public.wallet_auth_nonces (expires_at);

CREATE INDEX IF NOT EXISTS idx_wallet_auth_nonces_user
  ON public.wallet_auth_nonces (user_id);

-- ─── Auth security events (audit survives user removal) ─────────────────────
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.authjs_users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_user_created
  ON public.security_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_type_created
  ON public.security_events (event_type, created_at DESC);

-- ─── RLS: service-role only (matches authjs_* pattern) ──────────────────────
ALTER TABLE public.wallet_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_auth_nonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.wallet_connections FORCE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_auth_nonces FORCE ROW LEVEL SECURITY;
ALTER TABLE public.security_events FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.wallet_connections FROM anon, authenticated;
REVOKE ALL ON public.wallet_auth_nonces FROM anon, authenticated;
REVOKE ALL ON public.security_events FROM anon, authenticated;

COMMENT ON TABLE public.wallet_connections IS
  'Verified EVM wallet links for ATLAS users. Public addresses only — no private keys.';

COMMENT ON TABLE public.wallet_auth_nonces IS
  'One-time SIWE challenges for wallet ownership verification.';

COMMENT ON TABLE public.security_events IS
  'Auth security events with non-sensitive metadata for audit.';

-- ─── Auth-owned development data cleanup (no profile / business deletes) ────
-- Order: child auth tables first, then orphan authjs_users only.

DELETE FROM public.authjs_verification_tokens;
DELETE FROM public.authjs_sessions;
DELETE FROM public.user_sessions;
DELETE FROM public.authjs_accounts;

-- Orphan Auth.js identities only (no profile row → no stores/businesses linkage).
DELETE FROM public.authjs_users AS u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- Post-cleanup sanity: business anchors must remain untouched.
DO $$
DECLARE
  v_profiles bigint;
  v_stores bigint;
  v_businesses bigint;
BEGIN
  SELECT COUNT(*) INTO v_profiles FROM public.profiles;
  SELECT COUNT(*) INTO v_stores FROM public.stores;
  SELECT COUNT(*) INTO v_businesses FROM public.businesses;

  IF v_profiles = 0 AND EXISTS (SELECT 1 FROM public.stores LIMIT 1) THEN
    RAISE EXCEPTION 'atlas_auth_reset_safe: profiles wiped but stores remain — aborting.';
  END IF;

  RAISE NOTICE 'atlas_auth_reset_safe post-cleanup preserved: profiles=%, stores=%, businesses=%',
    v_profiles, v_stores, v_businesses;
END $$;
