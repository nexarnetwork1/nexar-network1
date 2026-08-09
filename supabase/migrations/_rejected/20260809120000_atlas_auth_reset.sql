-- ATLAS Auth reset — canonical identity model (development data cleanup).
-- Does NOT touch products, stores, marketplace catalog, or website content.

-- ─── Detach profiles from legacy Supabase Auth ─────────────────────────────
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Profiles are owned by Auth.js users (same UUID namespace).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_authjs_user_fk'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_authjs_user_fk
      FOREIGN KEY (id) REFERENCES public.authjs_users(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN foreign_key_violation THEN NULL;
END $$;

-- Drop legacy Supabase Auth auto-profile trigger (Auth.js owns profile creation).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ─── Wallet connections (verified, optional) ───────────────────────────────
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

-- ─── SIWE / wallet signature challenges ────────────────────────────────────
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

-- ─── Security audit events (safe metadata only) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.authjs_users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_user_created
  ON public.security_events (user_id, created_at DESC);

-- ─── RLS: service-role only (matches authjs_* pattern) ─────────────────────
ALTER TABLE public.wallet_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_auth_nonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.wallet_connections FORCE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_auth_nonces FORCE ROW LEVEL SECURITY;
ALTER TABLE public.security_events FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.wallet_connections FROM anon, authenticated;
REVOKE ALL ON public.wallet_auth_nonces FROM anon, authenticated;
REVOKE ALL ON public.security_events FROM anon, authenticated;

-- ─── Development auth data cleanup (no production users) ───────────────────
DELETE FROM public.user_sessions;
DELETE FROM public.authjs_verification_tokens;
DELETE FROM public.authjs_sessions;
DELETE FROM public.authjs_accounts;
DELETE FROM public.profiles;
DELETE FROM public.authjs_users;

COMMENT ON TABLE public.wallet_connections IS
  'Verified EVM wallet links for ATLAS users. Public addresses only — no private keys.';

COMMENT ON TABLE public.wallet_auth_nonces IS
  'One-time SIWE challenges for wallet ownership verification.';

COMMENT ON TABLE public.security_events IS
  'Auth security events with non-sensitive metadata for audit.';
