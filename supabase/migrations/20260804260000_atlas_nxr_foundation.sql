-- ATLAS NXR Token Ecosystem foundation (additive, backward-compatible)
-- Native utility token of ATLAS — works without blockchain.
-- Blockchain is an enhancement layer via adapters (NOT implemented here).
-- Does NOT duplicate fiat Wallet masters (wallet context). NXR balances live here.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE public.nxr_account_kind AS ENUM (
  'personal', 'business', 'treasury', 'reward_pool', 'reserve', 'developer'
);

CREATE TYPE public.nxr_tx_kind AS ENUM (
  'transfer', 'reward', 'purchase', 'subscription', 'ai_credit',
  'advertising', 'verification', 'boost', 'app_purchase', 'developer_payout',
  'mint', 'burn', 'deposit', 'withdraw', 'cashback', 'adjustment'
);

CREATE TYPE public.nxr_tx_status AS ENUM (
  'pending', 'completed', 'failed', 'reversed'
);

CREATE TYPE public.nxr_reward_kind AS ENUM (
  'business_activity', 'referral', 'marketplace', 'loyalty',
  'campaign', 'community', 'achievement', 'custom'
);

CREATE TYPE public.nxr_loyalty_tier AS ENUM (
  'bronze', 'silver', 'gold', 'platinum', 'enterprise'
);

CREATE TYPE public.nxr_premium_feature AS ENUM (
  'featured_business', 'featured_product', 'sponsored_post',
  'sponsored_company', 'verified_badge', 'ai_credits',
  'offline_pro', 'analytics_premium', 'custom'
);

CREATE TYPE public.nxr_utility AS ENUM (
  'subscription', 'marketplace', 'app_purchase', 'premium_feature',
  'ai_credits', 'advertising', 'verification', 'boost', 'developer_revenue'
);

-- ---------------------------------------------------------------------------
-- Token config (singleton-style row per deployment)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_nxr_token_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL DEFAULT 'NXR',
  name TEXT NOT NULL DEFAULT 'NEXAR',
  decimals SMALLINT NOT NULL DEFAULT 8,
  max_supply NUMERIC(36, 8), -- NULL = unlimited / configurable later
  circulating_supply NUMERIC(36, 8) NOT NULL DEFAULT 0,
  blockchain_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  base_fiat_currency TEXT NOT NULL DEFAULT 'USD',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.atlas_nxr_token_config (symbol, name, decimals, max_supply, blockchain_enabled)
SELECT 'NXR', 'NEXAR', 8, 1000000000, FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.atlas_nxr_token_config);

-- ---------------------------------------------------------------------------
-- NXR wallets / accounts (token ledger — not fiat wallets)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_nxr_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  kind public.nxr_account_kind NOT NULL DEFAULT 'personal',
  -- Optional link to fiat wallet master (wallet context)
  fiat_wallet_id UUID,
  balance NUMERIC(36, 8) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  locked_balance NUMERIC(36, 8) NOT NULL DEFAULT 0 CHECK (locked_balance >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (kind = 'personal' AND owner_user_id IS NOT NULL) OR
    (kind = 'business' AND business_id IS NOT NULL) OR
    (kind IN ('treasury', 'reward_pool', 'reserve', 'developer'))
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_nxr_accounts_personal
  ON public.atlas_nxr_accounts(owner_user_id) WHERE kind = 'personal' AND owner_user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_nxr_accounts_business
  ON public.atlas_nxr_accounts(business_id) WHERE kind = 'business' AND business_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_nxr_accounts_kind ON public.atlas_nxr_accounts(kind);

-- ---------------------------------------------------------------------------
-- Token ledger / transactions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_nxr_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_number TEXT NOT NULL UNIQUE,
  kind public.nxr_tx_kind NOT NULL,
  status public.nxr_tx_status NOT NULL DEFAULT 'pending',
  from_account_id UUID REFERENCES public.atlas_nxr_accounts(id) ON DELETE SET NULL,
  to_account_id UUID REFERENCES public.atlas_nxr_accounts(id) ON DELETE SET NULL,
  amount NUMERIC(36, 8) NOT NULL CHECK (amount > 0),
  utility public.nxr_utility,
  reference_type TEXT,
  reference_id UUID,
  memo TEXT,
  fiat_amount NUMERIC(20, 8),
  fiat_currency TEXT,
  exchange_rate NUMERIC(20, 10),
  actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nxr_tx_from ON public.atlas_nxr_transactions(from_account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nxr_tx_to ON public.atlas_nxr_transactions(to_account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nxr_tx_kind ON public.atlas_nxr_transactions(kind, status);
CREATE INDEX IF NOT EXISTS idx_nxr_tx_ref ON public.atlas_nxr_transactions(reference_type, reference_id);

-- ---------------------------------------------------------------------------
-- Mint / burn events (off-chain first; chain adapters later)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_nxr_mint_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_account_id UUID NOT NULL REFERENCES public.atlas_nxr_accounts(id) ON DELETE RESTRICT,
  amount NUMERIC(36, 8) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  transaction_id UUID REFERENCES public.atlas_nxr_transactions(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.atlas_nxr_burn_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_account_id UUID NOT NULL REFERENCES public.atlas_nxr_accounts(id) ON DELETE RESTRICT,
  amount NUMERIC(36, 8) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  transaction_id UUID REFERENCES public.atlas_nxr_transactions(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Treasury / reserve / reward pool tracking
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_nxr_treasury (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL UNIQUE REFERENCES public.atlas_nxr_accounts(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('treasury', 'reward_pool', 'reserve', 'developer_incentives', 'marketplace_incentives', 'referral_incentives')),
  label TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Exchange rates (NXR ↔ fiat; complements public.exchange_rates)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_nxr_exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_symbol TEXT NOT NULL DEFAULT 'NXR',
  quote_currency TEXT NOT NULL,
  rate NUMERIC(20, 10) NOT NULL CHECK (rate > 0),
  source TEXT NOT NULL DEFAULT 'internal',
  effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (base_symbol, quote_currency)
);

INSERT INTO public.atlas_nxr_exchange_rates (quote_currency, rate, source)
VALUES ('USD', 0.10, 'seed')
ON CONFLICT (base_symbol, quote_currency) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Rewards: rules, campaigns, grants
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_nxr_reward_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  kind public.nxr_reward_kind NOT NULL,
  amount NUMERIC(36, 8) NOT NULL DEFAULT 0,
  percent_of_amount NUMERIC(10, 6),
  max_per_user NUMERIC(36, 8),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.atlas_nxr_reward_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  rule_id UUID REFERENCES public.atlas_nxr_reward_rules(id) ON DELETE SET NULL,
  budget NUMERIC(36, 8) NOT NULL DEFAULT 0,
  spent NUMERIC(36, 8) NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.atlas_nxr_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.atlas_nxr_accounts(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.atlas_nxr_reward_rules(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.atlas_nxr_reward_campaigns(id) ON DELETE SET NULL,
  kind public.nxr_reward_kind NOT NULL,
  amount NUMERIC(36, 8) NOT NULL CHECK (amount > 0),
  transaction_id UUID REFERENCES public.atlas_nxr_transactions(id) ON DELETE SET NULL,
  reference_type TEXT,
  reference_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nxr_rewards_account
  ON public.atlas_nxr_rewards(account_id, created_at DESC);

INSERT INTO public.atlas_nxr_reward_rules (code, name, kind, amount) VALUES
  ('referral_signup', 'Referral Signup', 'referral', 10),
  ('marketplace_purchase', 'Marketplace Purchase Cashback', 'marketplace', 0),
  ('business_verified', 'Business Verification Bonus', 'business_activity', 50),
  ('loyalty_monthly', 'Loyalty Monthly Bonus', 'loyalty', 5),
  ('achievement_first_order', 'First Order Achievement', 'achievement', 15)
ON CONFLICT (code) DO NOTHING;

UPDATE public.atlas_nxr_reward_rules
SET percent_of_amount = 0.01, amount = 0
WHERE code = 'marketplace_purchase';

-- ---------------------------------------------------------------------------
-- Loyalty accounts (NXR loyalty — points + tier; distinct from legacy loyalty_*)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_nxr_loyalty_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  nxr_account_id UUID REFERENCES public.atlas_nxr_accounts(id) ON DELETE SET NULL,
  tier public.nxr_loyalty_tier NOT NULL DEFAULT 'bronze',
  points NUMERIC(36, 8) NOT NULL DEFAULT 0,
  lifetime_earned NUMERIC(36, 8) NOT NULL DEFAULT 0,
  cashback_rate NUMERIC(10, 6) NOT NULL DEFAULT 0.005,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (user_id IS NOT NULL OR business_id IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_nxr_loyalty_user
  ON public.atlas_nxr_loyalty_accounts(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_nxr_loyalty_business
  ON public.atlas_nxr_loyalty_accounts(business_id) WHERE business_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Business credits & premium features
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_nxr_business_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  credit_type TEXT NOT NULL, -- ai | advertising | boost | verification
  balance NUMERIC(36, 8) NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, credit_type)
);

CREATE TABLE IF NOT EXISTS public.atlas_nxr_premium_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.atlas_nxr_accounts(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  feature public.nxr_premium_feature NOT NULL,
  amount_paid NUMERIC(36, 8) NOT NULL DEFAULT 0,
  transaction_id UUID REFERENCES public.atlas_nxr_transactions(id) ON DELETE SET NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Subscription / token payments (billing intents — optional NXR rail)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_nxr_token_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_account_id UUID NOT NULL REFERENCES public.atlas_nxr_accounts(id) ON DELETE RESTRICT,
  payee_account_id UUID REFERENCES public.atlas_nxr_accounts(id) ON DELETE SET NULL,
  amount NUMERIC(36, 8) NOT NULL CHECK (amount > 0),
  utility public.nxr_utility NOT NULL,
  status public.nxr_tx_status NOT NULL DEFAULT 'pending',
  transaction_id UUID REFERENCES public.atlas_nxr_transactions(id) ON DELETE SET NULL,
  reference_type TEXT,
  reference_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- Rate limits / fraud monitoring hooks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_nxr_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.atlas_nxr_accounts(id) ON DELETE CASCADE,
  window_key TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  amount_total NUMERIC(36, 8) NOT NULL DEFAULT 0,
  window_starts_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, window_key)
);

-- ---------------------------------------------------------------------------
-- Audit (immutable intent — soft enforce via app)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_nxr_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  account_id UUID,
  transaction_id UUID,
  actor_user_id UUID,
  business_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nxr_audit_created
  ON public.atlas_nxr_audit_logs(created_at DESC);

-- Future stubs (schema reserved — no business logic yet)
CREATE TABLE IF NOT EXISTS public.atlas_nxr_staking_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{"status":"future"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.atlas_nxr_governance_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  metadata JSONB NOT NULL DEFAULT '{"status":"future"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.atlas_nxr_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_nxr_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_nxr_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_nxr_loyalty_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY nxr_accounts_select ON public.atlas_nxr_accounts FOR SELECT USING (true);
CREATE POLICY nxr_tx_select ON public.atlas_nxr_transactions FOR SELECT USING (true);
CREATE POLICY nxr_rewards_select ON public.atlas_nxr_rewards FOR SELECT USING (true);
CREATE POLICY nxr_loyalty_select ON public.atlas_nxr_loyalty_accounts FOR SELECT USING (true);
