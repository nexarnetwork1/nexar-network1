-- Platform extensions: escrow, disputes, verification, withdrawals, coupons,
-- webhooks, loyalty/POS/multi-chain/API architecture, settlement reports, search.

-- ─── Enums ───────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.escrow_status AS ENUM (
    'pending', 'held', 'released', 'refunded', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.dispute_status AS ENUM (
    'open', 'under_review', 'awaiting_info', 'approved', 'rejected', 'resolved', 'closed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.withdrawal_status AS ENUM (
    'pending', 'approved', 'rejected', 'processing', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.coupon_type AS ENUM ('percentage', 'fixed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.coupon_scope AS ENUM ('merchant', 'platform');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.webhook_event AS ENUM (
    'payment.success', 'payment.failure', 'refund', 'order.created', 'invoice.paid'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.webhook_delivery_status AS ENUM (
    'pending', 'delivered', 'failed', 'retrying'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.merchant_verification_level AS ENUM ('basic', 'business', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.settlement_report_period AS ENUM ('daily', 'weekly', 'monthly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Extend merchant verification statuses
ALTER TABLE public.merchant_profiles
  DROP CONSTRAINT IF EXISTS merchant_profiles_verification_status_check;

ALTER TABLE public.merchant_profiles
  ADD COLUMN IF NOT EXISTS verification_level public.merchant_verification_level NOT NULL DEFAULT 'basic',
  ADD COLUMN IF NOT EXISTS kyc_provider TEXT,
  ADD COLUMN IF NOT EXISTS kyc_reference TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blacklisted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blacklist_reason TEXT;

ALTER TABLE public.merchant_profiles
  ADD CONSTRAINT merchant_profiles_verification_status_check
  CHECK (verification_status IN (
    'pending', 'under_review', 'verified', 'rejected', 'suspended', 'blacklisted'
  ));

-- Extend notification types
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'dispute';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'withdrawal';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'verification';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'escrow';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'refund';

-- ─── Escrow ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.escrows (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  payment_session_id  UUID REFERENCES public.payment_sessions(id) ON DELETE SET NULL,
  settlement_id       UUID REFERENCES public.settlements(id) ON DELETE SET NULL,
  store_id            UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  customer_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount              NUMERIC(18, 8) NOT NULL CHECK (amount > 0),
  currency            TEXT NOT NULL DEFAULT 'USD',
  status              public.escrow_status NOT NULL DEFAULT 'pending',
  release_conditions  JSONB NOT NULL DEFAULT '{}',
  held_at             TIMESTAMPTZ,
  released_at         TIMESTAMPTZ,
  refunded_at         TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  released_by         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escrows_order ON public.escrows(order_id);
CREATE INDEX IF NOT EXISTS idx_escrows_store_status ON public.escrows(store_id, status);
CREATE INDEX IF NOT EXISTS idx_escrows_customer ON public.escrows(customer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.escrow_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id   UUID NOT NULL REFERENCES public.escrows(id) ON DELETE CASCADE,
  actor_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role  public.user_role,
  action      TEXT NOT NULL,
  from_status public.escrow_status,
  to_status   public.escrow_status,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escrow_events_escrow ON public.escrow_events(escrow_id, created_at DESC);

-- ─── Disputes ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.disputes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  escrow_id     UUID REFERENCES public.escrows(id) ON DELETE SET NULL,
  customer_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  store_id      UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  status        public.dispute_status NOT NULL DEFAULT 'open',
  reason        TEXT NOT NULL,
  resolution    TEXT,
  refund_amount NUMERIC(18, 8),
  resolved_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at   TIMESTAMPTZ,
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disputes_order ON public.disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_store ON public.disputes(store_id, status);
CREATE INDEX IF NOT EXISTS idx_disputes_customer ON public.disputes(customer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.dispute_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id  UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  sender_role public.user_role NOT NULL,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute ON public.dispute_messages(dispute_id, created_at);

CREATE TABLE IF NOT EXISTS public.dispute_evidence (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id   UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  uploaded_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  file_url     TEXT NOT NULL,
  file_type    TEXT,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispute_evidence_dispute ON public.dispute_evidence(dispute_id);

-- ─── Withdrawals ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  amount          NUMERIC(18, 8) NOT NULL CHECK (amount > 0),
  currency        TEXT NOT NULL DEFAULT 'USD',
  wallet_address  TEXT NOT NULL,
  chain_id        INTEGER NOT NULL DEFAULT 56,
  status          public.withdrawal_status NOT NULL DEFAULT 'pending',
  reviewed_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  rejection_reason TEXT,
  tx_hash         TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_merchant ON public.withdrawal_requests(merchant_id, status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_store ON public.withdrawal_requests(store_id, created_at DESC);

-- ─── Coupons ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.coupons (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT NOT NULL,
  coupon_type   public.coupon_type NOT NULL,
  coupon_scope  public.coupon_scope NOT NULL DEFAULT 'merchant',
  store_id      UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  value         NUMERIC(18, 8) NOT NULL CHECK (value > 0),
  currency      TEXT NOT NULL DEFAULT 'USD',
  usage_limit   INTEGER,
  used_count    INTEGER NOT NULL DEFAULT 0,
  min_order_usd NUMERIC(18, 8) NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at    TIMESTAMPTZ,
  created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT coupons_code_scope_unique UNIQUE (code, coupon_scope, store_id)
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(UPPER(code));
CREATE INDEX IF NOT EXISTS idx_coupons_store ON public.coupons(store_id) WHERE store_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id   UUID NOT NULL REFERENCES public.coupons(id) ON DELETE RESTRICT,
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  discount_usd NUMERIC(18, 8) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (coupon_id, order_id)
);

-- ─── Webhooks ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.merchant_webhooks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  secret_hash TEXT NOT NULL,
  secret_prefix TEXT NOT NULL,
  events      public.webhook_event[] NOT NULL DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_webhooks_store ON public.merchant_webhooks(store_id);

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id   UUID NOT NULL REFERENCES public.merchant_webhooks(id) ON DELETE CASCADE,
  event        public.webhook_event NOT NULL,
  payload      JSONB NOT NULL,
  status       public.webhook_delivery_status NOT NULL DEFAULT 'pending',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts  INTEGER NOT NULL DEFAULT 5,
  next_retry_at TIMESTAMPTZ,
  response_code INTEGER,
  response_body TEXT,
  delivered_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_pending ON public.webhook_deliveries(status, next_retry_at)
  WHERE status IN ('pending', 'retrying', 'failed');

-- ─── Settlement reports ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.settlement_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  period_type   public.settlement_report_period NOT NULL,
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  metrics       JSONB NOT NULL DEFAULT '{}',
  generated_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, period_type, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_settlement_reports_period ON public.settlement_reports(period_type, period_start DESC);

-- ─── Notification preferences ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel   TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'sms', 'push', 'telegram')),
  event_type TEXT NOT NULL,
  enabled   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, channel, event_type)
);

-- ─── Loyalty (future activation) ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.loyalty_programs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT FALSE,
  config      JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.loyalty_accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id  UUID NOT NULL REFERENCES public.loyalty_programs(id) ON DELETE RESTRICT,
  points      NUMERIC(18, 2) NOT NULL DEFAULT 0,
  vip_level   TEXT NOT NULL DEFAULT 'standard',
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, program_id)
);

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  UUID NOT NULL REFERENCES public.loyalty_accounts(id) ON DELETE CASCADE,
  tx_type     TEXT NOT NULL,
  points      NUMERIC(18, 2) NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── POS (future activation) ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pos_devices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL DEFAULT 'terminal',
  capabilities JSONB NOT NULL DEFAULT '{"barcode_scanner":false,"receipt_printer":false,"touch_screen":true}',
  is_active   BOOLEAN NOT NULL DEFAULT FALSE,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pos_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id   UUID NOT NULL REFERENCES public.pos_devices(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  opened_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at   TIMESTAMPTZ,
  metadata    JSONB NOT NULL DEFAULT '{}'
);

-- ─── Multi-chain ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.supported_chains (
  chain_id      INTEGER PRIMARY KEY,
  name          TEXT NOT NULL,
  symbol        TEXT NOT NULL,
  rpc_url       TEXT,
  explorer_url  TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT FALSE,
  fee_config    JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.supported_chains (chain_id, name, symbol, is_active, fee_config) VALUES
  (56, 'BNB Smart Chain', 'BNB', TRUE, '{"default_gas_gwei": 3}'),
  (1, 'Ethereum', 'ETH', FALSE, '{"default_gas_gwei": 20}'),
  (137, 'Polygon', 'MATIC', FALSE, '{"default_gas_gwei": 30}'),
  (101, 'Solana', 'SOL', FALSE, '{"priority_fee_lamports": 5000}')
ON CONFLICT (chain_id) DO NOTHING;

-- ─── Public API (extend api_keys) ────────────────────────────────────────────

ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS scopes TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rate_limit_per_minute INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS version TEXT NOT NULL DEFAULT 'v1';

-- ─── Triggers ────────────────────────────────────────────────────────────────

CREATE TRIGGER escrows_updated_at BEFORE UPDATE ON public.escrows
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER disputes_updated_at BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER withdrawal_requests_updated_at BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER coupons_updated_at BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER merchant_webhooks_updated_at BEFORE UPDATE ON public.merchant_webhooks
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- ─── Escrow RPCs ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION private.log_escrow_event(
  p_escrow_id UUID,
  p_actor_id UUID,
  p_actor_role public.user_role,
  p_action TEXT,
  p_from_status public.escrow_status,
  p_to_status public.escrow_status,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO public.escrow_events (escrow_id, actor_id, actor_role, action, from_status, to_status, metadata)
  VALUES (p_escrow_id, p_actor_id, p_actor_role, p_action, p_from_status, p_to_status, p_metadata)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_escrow_hold(
  p_order_id UUID,
  p_payment_session_id UUID,
  p_settlement_id UUID,
  p_amount NUMERIC,
  p_currency TEXT DEFAULT 'USD'
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_order RECORD;
  v_escrow_id UUID;
BEGIN
  SELECT o.*, s.id AS store_id INTO v_order
  FROM public.orders o
  JOIN public.stores s ON s.id = o.store_id
  WHERE o.id = p_order_id;

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  INSERT INTO public.escrows (
    order_id, payment_session_id, settlement_id, store_id, customer_id,
    amount, currency, status, held_at,
    release_conditions
  ) VALUES (
    p_order_id, p_payment_session_id, p_settlement_id, v_order.store_id, v_order.customer_id,
    p_amount, p_currency, 'held', NOW(),
    jsonb_build_object('auto_release_days', 7, 'requires_delivery_confirmation', false)
  ) RETURNING id INTO v_escrow_id;

  PERFORM private.log_escrow_event(
    v_escrow_id, v_order.customer_id,
    (SELECT role FROM public.profiles WHERE id = v_order.customer_id),
    'escrow.held', 'pending', 'held',
    jsonb_build_object('amount', p_amount, 'order_id', p_order_id)
  );

  RETURN v_escrow_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_escrow(
  p_escrow_id UUID,
  p_actor_id UUID,
  p_reason TEXT DEFAULT 'manual_release'
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_escrow RECORD;
  v_role public.user_role;
BEGIN
  SELECT * INTO v_escrow FROM public.escrows WHERE id = p_escrow_id FOR UPDATE;
  IF v_escrow IS NULL THEN RAISE EXCEPTION 'Escrow not found'; END IF;
  IF v_escrow.status != 'held' THEN RAISE EXCEPTION 'Escrow not held'; END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = p_actor_id;

  UPDATE public.escrows
  SET status = 'released', released_at = NOW(), released_by = p_actor_id, updated_at = NOW()
  WHERE id = p_escrow_id;

  PERFORM private.log_escrow_event(
    p_escrow_id, p_actor_id, v_role, 'escrow.released', 'held', 'released',
    jsonb_build_object('reason', p_reason)
  );

  PERFORM private.write_audit_log(
    p_actor_id, v_role, 'escrow.released', 'escrow', p_escrow_id,
    jsonb_build_object('order_id', v_escrow.order_id, 'amount', v_escrow.amount, 'reason', p_reason)
  );

  UPDATE public.settlements SET status = 'pending', completed_at = NULL
  WHERE id = v_escrow.settlement_id AND status = 'completed';

  RETURN jsonb_build_object('escrow_id', p_escrow_id, 'status', 'released');
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_escrow(
  p_escrow_id UUID,
  p_actor_id UUID,
  p_reason TEXT DEFAULT 'refund'
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_escrow RECORD;
  v_role public.user_role;
BEGIN
  SELECT * INTO v_escrow FROM public.escrows WHERE id = p_escrow_id FOR UPDATE;
  IF v_escrow IS NULL THEN RAISE EXCEPTION 'Escrow not found'; END IF;
  IF v_escrow.status NOT IN ('held', 'pending') THEN RAISE EXCEPTION 'Escrow not refundable'; END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = p_actor_id;

  UPDATE public.escrows
  SET status = 'refunded', refunded_at = NOW(), updated_at = NOW()
  WHERE id = p_escrow_id;

  UPDATE public.orders SET status = 'refunded', updated_at = NOW() WHERE id = v_escrow.order_id;

  PERFORM private.log_escrow_event(
    p_escrow_id, p_actor_id, v_role, 'escrow.refunded', v_escrow.status, 'refunded',
    jsonb_build_object('reason', p_reason)
  );

  PERFORM private.write_audit_log(
    p_actor_id, v_role, 'escrow.refunded', 'escrow', p_escrow_id,
    jsonb_build_object('order_id', v_escrow.order_id, 'reason', p_reason)
  );

  RETURN jsonb_build_object('escrow_id', p_escrow_id, 'status', 'refunded');
END;
$$;

-- ─── Dispute RPCs ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.open_dispute(
  p_order_id UUID,
  p_customer_id UUID,
  p_reason TEXT
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_order RECORD;
  v_escrow_id UUID;
  v_dispute_id UUID;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF v_order IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF v_order.customer_id != p_customer_id THEN RAISE EXCEPTION 'Not order owner'; END IF;
  IF v_order.status NOT IN ('paid', 'pending_payment') THEN RAISE EXCEPTION 'Order not disputable'; END IF;

  SELECT id INTO v_escrow_id FROM public.escrows
  WHERE order_id = p_order_id AND status = 'held' LIMIT 1;

  INSERT INTO public.disputes (order_id, escrow_id, customer_id, store_id, reason, status)
  VALUES (p_order_id, v_escrow_id, p_customer_id, v_order.store_id, p_reason, 'open')
  RETURNING id INTO v_dispute_id;

  PERFORM private.write_audit_log(
    p_customer_id, 'customer', 'dispute.opened', 'dispute', v_dispute_id,
    jsonb_build_object('order_id', p_order_id, 'reason', p_reason)
  );

  RETURN v_dispute_id;
END;
$$;

-- Global search RPC is defined in 20260727000020_realtime_search_completion.sql

-- ─── Realtime publication ────────────────────────────────────────────────────

DO $$
DECLARE
  t TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    RETURN;
  END IF;
  FOREACH t IN ARRAY ARRAY['orders', 'notifications', 'invoices', 'escrows', 'disputes'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.escrows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supported_chains ENABLE ROW LEVEL SECURITY;

-- Escrows
DROP POLICY IF EXISTS "Customers read own escrows" ON public.escrows;
CREATE POLICY "Customers read own escrows" ON public.escrows FOR SELECT
  USING (customer_id = auth.uid());
DROP POLICY IF EXISTS "Merchants read store escrows" ON public.escrows;
CREATE POLICY "Merchants read store escrows" ON public.escrows FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = escrows.store_id AND s.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Admins manage escrows" ON public.escrows;
CREATE POLICY "Admins manage escrows" ON public.escrows FOR ALL
  USING (private.current_user_role() = 'admin');

-- Disputes
DROP POLICY IF EXISTS "Customers manage own disputes" ON public.disputes;
CREATE POLICY "Customers manage own disputes" ON public.disputes FOR ALL
  USING (customer_id = auth.uid());
DROP POLICY IF EXISTS "Merchants read store disputes" ON public.disputes;
CREATE POLICY "Merchants read store disputes" ON public.disputes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = disputes.store_id AND s.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Merchants update store disputes" ON public.disputes;
CREATE POLICY "Merchants update store disputes" ON public.disputes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = disputes.store_id AND s.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Admins manage disputes" ON public.disputes;
CREATE POLICY "Admins manage disputes" ON public.disputes FOR ALL
  USING (private.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Dispute participants read messages" ON public.dispute_messages;
CREATE POLICY "Dispute participants read messages" ON public.dispute_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.disputes d WHERE d.id = dispute_messages.dispute_id
    AND (d.customer_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.stores s WHERE s.id = d.store_id AND s.owner_id = auth.uid()
    ) OR private.current_user_role() = 'admin')
  ));
DROP POLICY IF EXISTS "Dispute participants insert messages" ON public.dispute_messages;
CREATE POLICY "Dispute participants insert messages" ON public.dispute_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Dispute participants read evidence" ON public.dispute_evidence;
CREATE POLICY "Dispute participants read evidence" ON public.dispute_evidence FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.disputes d WHERE d.id = dispute_evidence.dispute_id
    AND (d.customer_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.stores s WHERE s.id = d.store_id AND s.owner_id = auth.uid()
    ) OR private.current_user_role() = 'admin')
  ));
DROP POLICY IF EXISTS "Dispute participants upload evidence" ON public.dispute_evidence;
CREATE POLICY "Dispute participants upload evidence" ON public.dispute_evidence FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

-- Withdrawals
DROP POLICY IF EXISTS "Merchants manage own withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Merchants manage own withdrawals" ON public.withdrawal_requests FOR ALL
  USING (merchant_id = auth.uid());
DROP POLICY IF EXISTS "Admins manage withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Admins manage withdrawals" ON public.withdrawal_requests FOR ALL
  USING (private.current_user_role() = 'admin');

-- Coupons
DROP POLICY IF EXISTS "Public read active coupons" ON public.coupons;
CREATE POLICY "Public read active coupons" ON public.coupons FOR SELECT
  USING (is_active AND (expires_at IS NULL OR expires_at > NOW()));
DROP POLICY IF EXISTS "Merchants manage store coupons" ON public.coupons;
CREATE POLICY "Merchants manage store coupons" ON public.coupons FOR ALL
  USING (store_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.stores s WHERE s.id = coupons.store_id AND s.owner_id = auth.uid()
  ));
DROP POLICY IF EXISTS "Admins manage platform coupons" ON public.coupons;
CREATE POLICY "Admins manage platform coupons" ON public.coupons FOR ALL
  USING (private.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Users read own redemptions" ON public.coupon_redemptions;
CREATE POLICY "Users read own redemptions" ON public.coupon_redemptions FOR SELECT
  USING (customer_id = auth.uid());

-- Webhooks
DROP POLICY IF EXISTS "Merchants manage store webhooks" ON public.merchant_webhooks;
CREATE POLICY "Merchants manage store webhooks" ON public.merchant_webhooks FOR ALL
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = merchant_webhooks.store_id AND s.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Admins read webhooks" ON public.merchant_webhooks;
CREATE POLICY "Admins read webhooks" ON public.merchant_webhooks FOR SELECT
  USING (private.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Merchants read webhook deliveries" ON public.webhook_deliveries;
CREATE POLICY "Merchants read webhook deliveries" ON public.webhook_deliveries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.merchant_webhooks w
    JOIN public.stores s ON s.id = w.store_id
    WHERE w.id = webhook_deliveries.webhook_id AND s.owner_id = auth.uid()
  ));

-- Settlement reports
DROP POLICY IF EXISTS "Merchants read own reports" ON public.settlement_reports;
CREATE POLICY "Merchants read own reports" ON public.settlement_reports FOR SELECT
  USING (store_id IS NULL OR EXISTS (
    SELECT 1 FROM public.stores s WHERE s.id = settlement_reports.store_id AND s.owner_id = auth.uid()
  ));
DROP POLICY IF EXISTS "Admins manage reports" ON public.settlement_reports;
CREATE POLICY "Admins manage reports" ON public.settlement_reports FOR ALL
  USING (private.current_user_role() = 'admin');

-- Notification preferences
DROP POLICY IF EXISTS "Users manage own preferences" ON public.notification_preferences;
CREATE POLICY "Users manage own preferences" ON public.notification_preferences FOR ALL
  USING (user_id = auth.uid());

-- Future modules (admin only until activated)
DROP POLICY IF EXISTS "Admins manage loyalty" ON public.loyalty_programs;
CREATE POLICY "Admins manage loyalty" ON public.loyalty_programs FOR ALL USING (private.current_user_role() = 'admin');
DROP POLICY IF EXISTS "Users read own loyalty" ON public.loyalty_accounts;
CREATE POLICY "Users read own loyalty" ON public.loyalty_accounts FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins manage pos" ON public.pos_devices;
CREATE POLICY "Admins manage pos" ON public.pos_devices FOR ALL
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = pos_devices.store_id AND (s.owner_id = auth.uid() OR private.current_user_role() = 'admin')));

DROP POLICY IF EXISTS "Public read active chains" ON public.supported_chains;
CREATE POLICY "Public read active chains" ON public.supported_chains FOR SELECT USING (is_active OR private.current_user_role() = 'admin');
DROP POLICY IF EXISTS "Admins manage chains" ON public.supported_chains;
CREATE POLICY "Admins manage chains" ON public.supported_chains FOR ALL USING (private.current_user_role() = 'admin');

GRANT EXECUTE ON FUNCTION public.create_escrow_hold(UUID, UUID, UUID, NUMERIC, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_escrow(UUID, UUID, TEXT) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_escrow(UUID, UUID, TEXT) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.open_dispute(UUID, UUID, TEXT) TO authenticated;
