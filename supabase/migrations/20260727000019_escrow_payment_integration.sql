-- Integrate escrow holds into payment completion flow.
-- Merchant funds are held in escrow; on-chain settlement waits for release.

CREATE OR REPLACE FUNCTION public.complete_payment(
  p_session_id      UUID,
  p_tx_hash         TEXT,
  p_verified_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session         RECORD;
  v_order           RECORD;
  v_store           RECORD;
  v_fees            RECORD;
  v_settlement_id   UUID;
  v_treasury_id     UUID;
  v_merchant_wallet UUID;
  v_customer_wallet UUID;
  v_escrow_id       UUID;
BEGIN
  SELECT * INTO v_session FROM public.payment_sessions
  WHERE id = p_session_id FOR UPDATE;

  IF v_session IS NULL THEN
    RAISE EXCEPTION 'Payment session not found';
  END IF;

  IF v_session.status NOT IN ('waiting', 'waiting_confirmation', 'pending') THEN
    RAISE EXCEPTION 'Payment session not payable (status: %)', v_session.status;
  END IF;

  IF v_session.expires_at < NOW() THEN
    UPDATE public.payment_sessions SET status = 'expired', updated_at = NOW() WHERE id = p_session_id;
    RAISE EXCEPTION 'Payment session expired';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = v_session.order_id FOR UPDATE;
  SELECT * INTO v_store FROM public.stores WHERE id = v_order.store_id;

  SELECT * INTO v_fees FROM private.calculate_platform_fee(
    v_session.amount_usd, v_session.method, v_order.store_id
  );

  v_treasury_id := private.get_treasury_wallet_id();
  IF v_treasury_id IS NULL THEN
    RAISE EXCEPTION 'Treasury wallet not configured';
  END IF;

  v_merchant_wallet := private.get_or_create_merchant_wallet(v_store.owner_id);

  SELECT w.id INTO v_customer_wallet
  FROM public.wallets w
  WHERE w.owner_type = 'customer' AND w.owner_id = v_order.customer_id AND w.is_primary = TRUE
  LIMIT 1;

  IF v_customer_wallet IS NULL THEN
    INSERT INTO public.wallets (owner_type, owner_id, label, is_primary)
    VALUES ('customer', v_order.customer_id, 'Primary Customer Wallet', TRUE)
    RETURNING id INTO v_customer_wallet;
  END IF;

  INSERT INTO public.payment_attempts (
    payment_session_id, tx_hash, amount, currency, confirmations, status
  ) VALUES (
    p_session_id, p_tx_hash, p_verified_amount, v_session.currency, 12, 'confirmed'
  );

  UPDATE public.payment_sessions
  SET status = 'paid', paid_at = NOW(), updated_at = NOW()
  WHERE id = p_session_id;

  UPDATE public.invoices
  SET status = 'paid', paid_at = NOW()
  WHERE id = v_session.invoice_id;

  UPDATE public.orders
  SET
    status = 'paid',
    paid_at = NOW(),
    updated_at = NOW(),
    payment_method = CASE WHEN v_session.method = 'card' THEN 'card'::public.payment_method ELSE 'crypto'::public.payment_method END,
    platform_fee = v_fees.platform_fee,
    merchant_amount = v_fees.merchant_amount
  WHERE id = v_session.order_id;

  -- Settlement pending until escrow released (merchant payout held)
  INSERT INTO public.settlements (
    payment_session_id, order_id, gross_amount, platform_fee, merchant_amount,
    fee_rate_applied, promotion_id, currency, status
  ) VALUES (
    p_session_id, v_order.id, v_session.amount_usd, v_fees.platform_fee,
    v_fees.merchant_amount, v_fees.fee_rate, v_fees.promotion_id, 'USD', 'pending'
  ) RETURNING id INTO v_settlement_id;

  -- Platform fee → treasury (immediate)
  PERFORM private.record_wallet_transaction(
    v_treasury_id, 'fee_collection', v_fees.platform_fee, v_session.currency,
    'settlement', v_settlement_id, p_tx_hash,
    jsonb_build_object('order_id', v_order.id, 'fee_rate', v_fees.fee_rate)
  );

  -- Merchant portion held in escrow (NOT credited to withdrawable balance)
  v_escrow_id := public.create_escrow_hold(
    v_order.id, p_session_id, v_settlement_id, v_fees.merchant_amount, v_session.currency
  );

  PERFORM private.record_wallet_transaction(
    v_merchant_wallet, 'adjustment', v_fees.merchant_amount, v_session.currency,
    'escrow', v_escrow_id, p_tx_hash,
    jsonb_build_object('order_id', v_order.id, 'escrow_status', 'held', 'locked', true)
  );

  PERFORM private.record_wallet_transaction(
    v_customer_wallet, 'payment_out', v_session.amount_usd, 'USD',
    'order', v_order.id, p_tx_hash,
    jsonb_build_object('session_id', p_session_id)
  );

  INSERT INTO public.settlement_transfers (
    settlement_id, transfer_type, to_address, amount, currency, tx_hash, status
  ) VALUES
    (v_settlement_id, 'platform_fee', (SELECT address FROM public.wallets WHERE id = v_treasury_id), v_fees.platform_fee, v_session.currency, p_tx_hash, 'confirmed');

  -- Merchant payout transfer created but pending until escrow release
  INSERT INTO public.settlement_transfers (
    settlement_id, transfer_type, to_address, amount, currency, status
  ) VALUES
    (v_settlement_id, 'merchant_payout', (SELECT address FROM public.wallets WHERE id = v_merchant_wallet), v_fees.merchant_amount, v_session.currency, 'pending');

  UPDATE public.customer_profiles
  SET total_orders = total_orders + 1,
      total_spent_usd = total_spent_usd + v_session.amount_usd,
      updated_at = NOW()
  WHERE profile_id = v_order.customer_id;

  UPDATE public.merchant_profiles
  SET total_orders = total_orders + 1,
      updated_at = NOW()
  WHERE profile_id = v_store.owner_id;

  PERFORM private.write_audit_log(
    v_order.customer_id,
    (SELECT role FROM public.profiles WHERE id = v_order.customer_id),
    'payment.completed',
    'order',
    v_order.id,
    jsonb_build_object(
      'session_id', p_session_id,
      'settlement_id', v_settlement_id,
      'escrow_id', v_escrow_id,
      'tx_hash', p_tx_hash,
      'platform_fee', v_fees.platform_fee,
      'merchant_amount_held', v_fees.merchant_amount,
      'treasury_wallet_id', v_treasury_id,
      'merchant_wallet_id', v_merchant_wallet
    )
  );

  RETURN jsonb_build_object(
    'settlement_id', v_settlement_id,
    'escrow_id', v_escrow_id,
    'order_id', v_order.id,
    'platform_fee', v_fees.platform_fee,
    'merchant_amount', v_fees.merchant_amount,
    'status', 'paid',
    'escrow_status', 'held'
  );
END;
$$;
