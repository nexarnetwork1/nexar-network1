-- Auth.js tables + role extensions (applied on remote; kept in-repo for parity).
-- Does not recreate products, orders, merchants, stores, or analytics.

DO $$ BEGIN
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'business';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'super_admin';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.authjs_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  image TEXT,
  password TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.authjs_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES public.authjs_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE (provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS public.authjs_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId" UUID NOT NULL REFERENCES public.authjs_users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS public.authjs_verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

CREATE INDEX IF NOT EXISTS idx_authjs_accounts_user ON public.authjs_accounts("userId");
CREATE INDEX IF NOT EXISTS idx_authjs_sessions_user ON public.authjs_sessions("userId");

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_wallet_address_unique
  ON public.profiles (lower(wallet_address))
  WHERE wallet_address IS NOT NULL AND wallet_address <> '';
