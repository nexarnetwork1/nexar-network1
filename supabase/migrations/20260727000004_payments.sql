-- Nexar Network: Payments & Settlement (Phase 4)

-- ─── Payment Sessions ────────────────────────────────────────────────────────
CREATE TABLE public.payment_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id       UUID NOT NULL UNIQUE REFERENCES public.invoices(id) ON DELETE RESTRICT,
  order_id         UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  status           public.payment_session_status NOT NULL DEFAULT 'waiting',
  method           TEXT NOT NULL CHECK (method IN ('NXR', 'BNB', 'USDT', 'card')),
  amount           NUMERIC(30,18) NOT NULL CHECK (amount > 0),
  currency         TEXT NOT NULL,
  amount_usd       NUMERIC(20,8) NOT NULL,
  deposit_address  TEXT,
  qr_payload       TEXT,
  expires_at       TIMESTAMPTZ NOT NULL,
  paid_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_sessions_status_expires
  ON public.payment_sessions(status, expires_at);
CREATE INDEX idx_payment_sessions_order ON public.payment_sessions(order_id);

CREATE TRIGGER payment_sessions_updated_at
  BEFORE UPDATE ON public.payment_sessions
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- ─── Payment Attempts ────────────────────────────────────────────────────────
CREATE TABLE public.payment_attempts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_session_id  UUID NOT NULL REFERENCES public.payment_sessions(id) ON DELETE CASCADE,
  tx_hash             TEXT,
  amount              NUMERIC(30,18),
  currency            TEXT,
  confirmations       INTEGER DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'failed')),
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_payment_attempts_tx_hash
  ON public.payment_attempts(tx_hash) WHERE tx_hash IS NOT NULL;

-- ─── Settlements ─────────────────────────────────────────────────────────────
CREATE TABLE public.settlements (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_session_id  UUID NOT NULL UNIQUE REFERENCES public.payment_sessions(id),
  order_id            UUID NOT NULL REFERENCES public.orders(id),
  gross_amount        NUMERIC(20,8) NOT NULL,
  platform_fee        NUMERIC(20,8) NOT NULL,
  merchant_amount     NUMERIC(20,8) NOT NULL,
  fee_rate_applied    NUMERIC(5,4) NOT NULL,
  promotion_id        UUID REFERENCES public.merchant_promotions(id),
  currency            TEXT NOT NULL DEFAULT 'USD',
  status              public.settlement_status NOT NULL DEFAULT 'pending',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ
);

-- ─── Settlement Transfers ────────────────────────────────────────────────────
CREATE TABLE public.settlement_transfers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id   UUID NOT NULL REFERENCES public.settlements(id) ON DELETE CASCADE,
  transfer_type   public.transfer_type NOT NULL,
  to_address      TEXT NOT NULL,
  amount          NUMERIC(30,18) NOT NULL,
  currency        TEXT NOT NULL,
  tx_hash         TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'submitted', 'confirmed', 'failed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_settlement_transfers_settlement ON public.settlement_transfers(settlement_id);

-- ─── Exchange rates cache ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency  TEXT NOT NULL,
  quote_currency TEXT NOT NULL DEFAULT 'USD',
  rate           NUMERIC(20,8) NOT NULL,
  source         TEXT NOT NULL DEFAULT 'manual',
  fetched_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_exchange_rates_pair
  ON public.exchange_rates(base_currency, quote_currency);

-- Seed default rates (updated by admin/worker in production)
INSERT INTO public.exchange_rates (base_currency, quote_currency, rate, source) VALUES
  ('BNB', 'USD', 600.00, 'seed'),
  ('NXR', 'USD', 0.05, 'seed'),
  ('USDT', 'USD', 1.00, 'seed')
ON CONFLICT DO NOTHING;

-- ─── Fee calculation ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION private.calculate_platform_fee(
  p_amount     NUMERIC,
  p_method     TEXT,
  p_store_id   UUID
)
RETURNS TABLE (
  platform_fee    NUMERIC,
  merchant_amount NUMERIC,
  fee_rate        NUMERIC,
  promotion_id    UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_rate     NUMERIC;
  v_discount      NUMERIC := 0;
  v_promotion_id  UUID;
  v_final_rate    NUMERIC;
BEGIN
  IF p_method = 'NXR' THEN
    SELECT base_rate INTO v_base_rate FROM public.fee_schedules
    WHERE payment_type = 'nxr' ORDER BY effective_from DESC LIMIT 1;
  ELSIF p_method = 'card' THEN
    SELECT base_rate INTO v_base_rate FROM public.fee_schedules
    WHERE payment_type = 'card' ORDER BY effective_from DESC LIMIT 1;
  ELSE
    SELECT base_rate INTO v_base_rate FROM public.fee_schedules
    WHERE payment_type = 'crypto_other' ORDER BY effective_from DESC LIMIT 1;
  END IF;

  v_base_rate := COALESCE(v_base_rate, 0.05);

  SELECT mp.id, mp.discount_percent INTO v_promotion_id, v_discount
  FROM public.merchant_promotions mp
  WHERE mp.store_id = p_store_id
    AND mp.is_active = TRUE
    AND mp.expires_at > NOW()
  ORDER BY mp.created_at DESC
  LIMIT 1;

  IF v_discount > 0 THEN
    v_final_rate := v_base_rate * (1 - v_discount / 100);
  ELSE
    v_final_rate := v_base_rate;
  END IF;

  platform_fee := ROUND(p_amount * v_final_rate, 8);
  merchant_amount := p_amount - platform_fee;
  fee_rate := v_final_rate;
  promotion_id := v_promotion_id;
  RETURN NEXT;
END;
$$;

-- ─── Create payment session ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_payment_session(
  p_session_id  UUID,
  p_invoice_id  UUID,
  p_method      TEXT,
  p_deposit_address TEXT,
  p_qr_payload  TEXT,
  p_crypto_amount NUMERIC,
  p_currency    TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id UUID := auth.uid();
  v_invoice     RECORD;
BEGIN
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_invoice FROM public.invoices
  WHERE id = p_invoice_id AND customer_id = v_customer_id;

  IF v_invoice IS NULL THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  IF v_invoice.status NOT IN ('pending', 'draft') THEN
    RAISE EXCEPTION 'Invoice is not payable';
  END IF;

  UPDATE public.payment_sessions
  SET status = 'expired', updated_at = NOW()
  WHERE invoice_id = p_invoice_id AND status = 'waiting';

  INSERT INTO public.payment_sessions (
    id, invoice_id, order_id, method, amount, currency, amount_usd,
    deposit_address, qr_payload, expires_at
  ) VALUES (
    p_session_id,
    p_invoice_id,
    v_invoice.order_id,
    p_method,
    p_crypto_amount,
    p_currency,
    v_invoice.amount,
    p_deposit_address,
    p_qr_payload,
    NOW() + INTERVAL '5 minutes'
  );

  UPDATE public.invoices SET status = 'pending' WHERE id = p_invoice_id;

  PERFORM private.write_audit_log(
    v_customer_id,
    (SELECT role FROM public.profiles WHERE id = v_customer_id),
    'payment.session_created',
    'payment_session',
    p_session_id,
    jsonb_build_object('method', p_method, 'invoice_id', p_invoice_id)
  );

  RETURN jsonb_build_object(
    'session_id', p_session_id,
    'expires_at', (NOW() + INTERVAL '5 minutes')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_payment_session(UUID, UUID, TEXT, TEXT, TEXT, NUMERIC, TEXT) TO authenticated;

-- ─── Complete payment (called after on-chain verification) ───────────────────
CREATE OR REPLACE FUNCTION public.complete_payment(
  p_session_id  UUID,
  p_tx_hash     TEXT,
  p_verified_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session     RECORD;
  v_order       RECORD;
  v_fees        RECORD;
  v_settlement_id UUID;
BEGIN
  SELECT * INTO v_session FROM public.payment_sessions
  WHERE id = p_session_id FOR UPDATE;

  IF v_session IS NULL THEN
    RAISE EXCEPTION 'Payment session not found';
  END IF;

  IF v_session.status != 'waiting' THEN
    RAISE EXCEPTION 'Payment session not waiting';
  END IF;

  IF v_session.expires_at < NOW() THEN
    UPDATE public.payment_sessions SET status = 'expired' WHERE id = p_session_id;
    RAISE EXCEPTION 'Payment session expired';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = v_session.order_id FOR UPDATE;

  SELECT * INTO v_fees FROM private.calculate_platform_fee(
    v_session.amount_usd, v_session.method, v_order.store_id
  );

  INSERT INTO public.payment_attempts (
    payment_session_id, tx_hash, amount, currency, confirmations, status
  ) VALUES (
    p_session_id, p_tx_hash, p_verified_amount, v_session.currency, 12, 'confirmed'
  );

  UPDATE public.payment_sessions
  SET status = 'paid', paid_at = NOW()
  WHERE id = p_session_id;

  UPDATE public.invoices
  SET status = 'paid', paid_at = NOW()
  WHERE id = v_session.invoice_id;

  UPDATE public.orders
  SET
    status = 'paid',
    paid_at = NOW(),
    payment_method = CASE WHEN v_session.method = 'card' THEN 'card'::public.payment_method ELSE 'crypto'::public.payment_method END,
    platform_fee = v_fees.platform_fee,
    merchant_amount = v_fees.merchant_amount
  WHERE id = v_session.order_id;

  INSERT INTO public.settlements (
    payment_session_id, order_id, gross_amount, platform_fee, merchant_amount,
    fee_rate_applied, promotion_id, currency, status
  ) VALUES (
    p_session_id, v_order.id, v_session.amount_usd, v_fees.platform_fee,
    v_fees.merchant_amount, v_fees.fee_rate, v_fees.promotion_id, 'USD', 'pending'
  ) RETURNING id INTO v_settlement_id;

  PERFORM private.write_audit_log(
    v_order.customer_id,
    (SELECT role FROM public.profiles WHERE id = v_order.customer_id),
    'payment.completed',
    'order',
    v_order.id,
    jsonb_build_object(
      'session_id', p_session_id,
      'settlement_id', v_settlement_id,
      'tx_hash', p_tx_hash,
      'platform_fee', v_fees.platform_fee,
      'merchant_amount', v_fees.merchant_amount
    )
  );

  RETURN jsonb_build_object(
    'settlement_id', v_settlement_id,
    'order_id', v_order.id,
    'platform_fee', v_fees.platform_fee,
    'merchant_amount', v_fees.merchant_amount
  );
END;
$$;

-- Only service role should call complete_payment after verification
REVOKE ALL ON FUNCTION public.complete_payment(UUID, TEXT, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_payment(UUID, TEXT, NUMERIC) TO service_role;

-- ─── Expire stale sessions (cron) ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.expire_stale_payment_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.payment_sessions
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'waiting' AND expires_at < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE public.invoices i
  SET status = 'expired'
  FROM public.payment_sessions ps
  WHERE ps.invoice_id = i.id
    AND ps.status = 'expired'
    AND i.status = 'pending';

  UPDATE public.orders o
  SET status = 'expired'
  FROM public.payment_sessions ps
  WHERE ps.order_id = o.id
    AND ps.status = 'expired'
    AND o.status = 'pending_payment';

  RETURN v_count;
END;
$$;

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.payment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can read own payment sessions"
  ON public.payment_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = payment_sessions.invoice_id
        AND invoices.customer_id = auth.uid()
    )
  );

CREATE POLICY "Merchants can read store payment sessions"
  ON public.payment_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.stores s ON s.id = o.store_id
      WHERE o.id = payment_sessions.order_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage payment sessions"
  ON public.payment_sessions FOR ALL
  USING (private.current_user_role() = 'admin');

CREATE POLICY "Customers can read own payment attempts"
  ON public.payment_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.payment_sessions ps
      JOIN public.invoices i ON i.id = ps.invoice_id
      WHERE ps.id = payment_attempts.payment_session_id
        AND i.customer_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage payment attempts"
  ON public.payment_attempts FOR ALL
  USING (private.current_user_role() = 'admin');

CREATE POLICY "Merchants can read store settlements"
  ON public.settlements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.stores s ON s.id = o.store_id
      WHERE o.id = settlements.order_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage settlements"
  ON public.settlements FOR ALL
  USING (private.current_user_role() = 'admin');

CREATE POLICY "Admins can manage settlement transfers"
  ON public.settlement_transfers FOR ALL
  USING (private.current_user_role() = 'admin');

CREATE POLICY "Anyone authenticated can read exchange rates"
  ON public.exchange_rates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage exchange rates"
  ON public.exchange_rates FOR ALL
  USING (private.current_user_role() = 'admin');

-- Public wrapper for fee calculation
CREATE OR REPLACE FUNCTION public.calculate_platform_fee(
  p_amount   NUMERIC,
  p_method   TEXT,
  p_store_id UUID
)
RETURNS TABLE (
  platform_fee    NUMERIC,
  merchant_amount NUMERIC,
  fee_rate        NUMERIC,
  promotion_id    UUID
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM private.calculate_platform_fee(p_amount, p_method, p_store_id);
$$;

GRANT EXECUTE ON FUNCTION public.calculate_platform_fee(NUMERIC, TEXT, UUID) TO authenticated, service_role;

-- Realtime for payment status updates in popup
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_sessions;
