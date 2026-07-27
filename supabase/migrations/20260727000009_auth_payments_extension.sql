-- Auth session preferences, merchant payment requests, invoice share links, secure QR payloads

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS single_session_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  ADD COLUMN IF NOT EXISTS description TEXT;

CREATE INDEX IF NOT EXISTS idx_invoices_share_token ON public.invoices(share_token);

-- Merchant creates a payment request (payments-only POS / manual invoice)
CREATE OR REPLACE FUNCTION public.create_merchant_payment_request(
  p_store_id UUID,
  p_amount NUMERIC,
  p_description TEXT,
  p_customer_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_merchant_id UUID := auth.uid();
  v_customer_id UUID;
  v_store_wallet TEXT;
  v_order_id UUID;
  v_invoice_id UUID;
  v_invoice_num TEXT;
  v_share_token TEXT;
BEGIN
  IF v_merchant_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  IF p_description IS NULL OR length(trim(p_description)) < 2 THEN
    RAISE EXCEPTION 'Description required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.stores
    WHERE id = p_store_id AND owner_id = v_merchant_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Store not found or not active';
  END IF;

  SELECT id INTO v_customer_id
  FROM public.profiles
  WHERE lower(email) = lower(trim(p_customer_email))
    AND role = 'customer'
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer not found for email: %', p_customer_email;
  END IF;

  SELECT wallet_address INTO v_store_wallet
  FROM public.stores WHERE id = p_store_id;

  INSERT INTO public.orders (
    customer_id, store_id, status, subtotal, currency, merchant_wallet_snapshot
  ) VALUES (
    v_customer_id, p_store_id, 'pending_payment', p_amount, 'USD', v_store_wallet
  ) RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (
    order_id, product_id, product_name, quantity, unit_price, line_total
  ) VALUES (
    v_order_id, NULL, trim(p_description), 1, p_amount, p_amount
  );

  v_invoice_num := private.next_invoice_number();
  v_share_token := encode(gen_random_bytes(16), 'hex');

  INSERT INTO public.invoices (
    invoice_number, order_id, customer_id, store_id,
    amount, currency, status, description, share_token
  ) VALUES (
    v_invoice_num, v_order_id, v_customer_id, p_store_id,
    p_amount, 'USD', 'pending', trim(p_description), v_share_token
  ) RETURNING id INTO v_invoice_id;

  PERFORM private.write_audit_log(
    v_merchant_id,
    'merchant',
    'invoice.payment_request_created',
    'invoice',
    v_invoice_id,
    jsonb_build_object(
      'order_id', v_order_id,
      'invoice_number', v_invoice_num,
      'amount', p_amount,
      'customer_email', p_customer_email
    )
  );

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'invoice_id', v_invoice_id,
    'invoice_number', v_invoice_num,
    'share_token', v_share_token
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_merchant_payment_request(UUID, NUMERIC, TEXT, TEXT) TO authenticated;

-- Cancel a waiting payment session (customer only)
CREATE OR REPLACE FUNCTION public.cancel_payment_session(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.payment_sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_session
  FROM public.payment_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = v_session.invoice_id AND i.customer_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF v_session.status <> 'waiting' THEN
    RAISE EXCEPTION 'Session cannot be cancelled';
  END IF;

  UPDATE public.payment_sessions
  SET status = 'expired', updated_at = NOW()
  WHERE id = p_session_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_payment_session(UUID) TO authenticated;

-- Resolve QR token (public metadata only — no wallet addresses)
CREATE OR REPLACE FUNCTION public.resolve_qr_token(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_qr public.qr_codes%ROWTYPE;
  v_store public.stores%ROWTYPE;
BEGIN
  SELECT * INTO v_qr
  FROM public.qr_codes
  WHERE secret_token = p_token AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW());

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_store
  FROM public.stores
  WHERE id = v_qr.store_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'qr_type', v_qr.qr_type,
    'store_id', v_store.id,
    'store_name', v_store.name,
    'store_slug', v_store.slug,
    'store_mode', v_store.mode,
    'logo_url', v_store.logo_url
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_qr_token(TEXT) TO anon, authenticated;

-- Resolve invoice share token for public pay links
CREATE OR REPLACE FUNCTION public.resolve_invoice_share_token(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_invoice public.invoices%ROWTYPE;
  v_store public.stores%ROWTYPE;
BEGIN
  SELECT * INTO v_invoice
  FROM public.invoices
  WHERE share_token = p_token AND status IN ('pending', 'draft');

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_store FROM public.stores WHERE id = v_invoice.store_id;

  RETURN jsonb_build_object(
    'invoice_id', v_invoice.id,
    'invoice_number', v_invoice.invoice_number,
    'amount', v_invoice.amount,
    'currency', v_invoice.currency,
    'description', v_invoice.description,
    'store_name', v_store.name,
    'store_id', v_store.id,
    'status', v_invoice.status
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_invoice_share_token(TEXT) TO anon, authenticated;
