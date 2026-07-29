-- Nexar Network: Database architecture completion
-- Fills remaining gaps without recreating existing schema (000000–000015).

-- ═══════════════════════════════════════════════════════════════════════════════
-- VIEW ALIASES (requested table names → physical tables)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.sessions AS
SELECT
  id,
  user_id,
  ip_address,
  user_agent,
  last_seen_at,
  expires_at,
  revoked_at,
  created_at,
  updated_at
FROM public.user_sessions;

GRANT SELECT ON public.sessions TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════════
-- INVENTORY: auto-create on product insert + checkout sync
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION private.ensure_product_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.inventory (product_id, quantity_on_hand, low_stock_threshold)
  VALUES (NEW.id, COALESCE(NEW.stock, 0), 5)
  ON CONFLICT (product_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_ensure_inventory ON public.products;
CREATE TRIGGER products_ensure_inventory
  AFTER INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION private.ensure_product_inventory();

-- Backfill any products missing inventory rows
INSERT INTO public.inventory (product_id, quantity_on_hand)
SELECT p.id, COALESCE(p.stock, 0)
FROM public.products p
WHERE NOT EXISTS (SELECT 1 FROM public.inventory i WHERE i.product_id = p.id)
ON CONFLICT (product_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.create_store_checkout(
  p_store_id UUID,
  p_cart_id  UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id   UUID := auth.uid();
  v_order_id      UUID;
  v_invoice_id    UUID;
  v_invoice_num   TEXT;
  v_subtotal      NUMERIC(20,8) := 0;
  v_store_wallet  TEXT;
  v_cart_item     RECORD;
  v_product       RECORD;
BEGIN
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.carts
    WHERE id = p_cart_id AND customer_id = v_customer_id
  ) THEN
    RAISE EXCEPTION 'Cart not found';
  END IF;

  SELECT wallet_address INTO v_store_wallet
  FROM public.stores
  WHERE id = p_store_id AND status = 'active';

  IF v_store_wallet IS NULL THEN
    RAISE EXCEPTION 'Store not available';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.cart_items ci
    JOIN public.products p ON p.id = ci.product_id
    WHERE ci.cart_id = p_cart_id AND p.store_id = p_store_id
  ) THEN
    RAISE EXCEPTION 'No items for this store in cart';
  END IF;

  FOR v_cart_item IN
    SELECT ci.id AS cart_item_id, ci.quantity, ci.product_id
    FROM public.cart_items ci
    JOIN public.products p ON p.id = ci.product_id
    WHERE ci.cart_id = p_cart_id AND p.store_id = p_store_id
  LOOP
    SELECT * INTO v_product
    FROM public.products
    WHERE id = v_cart_item.product_id AND is_active = TRUE
    FOR UPDATE;

    IF v_product IS NULL THEN
      RAISE EXCEPTION 'Product unavailable: %', v_cart_item.product_id;
    END IF;

    IF v_product.stock < v_cart_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product: %', v_product.name;
    END IF;

    v_subtotal := v_subtotal + (v_product.price * v_cart_item.quantity);
  END LOOP;

  INSERT INTO public.orders (
    customer_id, store_id, status, subtotal, currency, merchant_wallet_snapshot
  ) VALUES (
    v_customer_id, p_store_id, 'pending_payment', v_subtotal, 'USD', v_store_wallet
  ) RETURNING id INTO v_order_id;

  FOR v_cart_item IN
    SELECT ci.id AS cart_item_id, ci.quantity, ci.product_id
    FROM public.cart_items ci
    JOIN public.products p ON p.id = ci.product_id
    WHERE ci.cart_id = p_cart_id AND p.store_id = p_store_id
  LOOP
    SELECT * INTO v_product FROM public.products WHERE id = v_cart_item.product_id;

    INSERT INTO public.order_items (
      order_id, product_id, product_name, quantity, unit_price, line_total
    ) VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_cart_item.quantity,
      v_product.price,
      v_product.price * v_cart_item.quantity
    );

    UPDATE public.products
    SET stock = stock - v_cart_item.quantity
    WHERE id = v_product.id;

    UPDATE public.inventory
    SET quantity_on_hand = quantity_on_hand - v_cart_item.quantity,
        updated_at = NOW()
    WHERE product_id = v_product.id;

    DELETE FROM public.cart_items WHERE id = v_cart_item.cart_item_id;
  END LOOP;

  v_invoice_num := private.next_invoice_number();

  INSERT INTO public.invoices (
    invoice_number, order_id, customer_id, store_id, amount, currency, status
  ) VALUES (
    v_invoice_num, v_order_id, v_customer_id, p_store_id, v_subtotal, 'USD', 'pending'
  ) RETURNING id INTO v_invoice_id;

  PERFORM private.write_audit_log(
    v_customer_id,
    (SELECT role FROM public.profiles WHERE id = v_customer_id),
    'checkout.created',
    'order',
    v_order_id,
    jsonb_build_object(
      'invoice_id', v_invoice_id,
      'invoice_number', v_invoice_num,
      'store_id', p_store_id,
      'subtotal', v_subtotal
    )
  );

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'invoice_id', v_invoice_id,
    'invoice_number', v_invoice_num
  );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS: merchant settlement transfer visibility + store-scoped audit logs
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Merchants read store settlement transfers" ON public.settlement_transfers;
CREATE POLICY "Merchants read store settlement transfers"
  ON public.settlement_transfers FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.settlements s
      JOIN public.orders o ON o.id = s.order_id
      JOIN public.stores st ON st.id = o.store_id
      WHERE s.id = settlement_transfers.settlement_id
        AND st.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Merchants read store audit logs" ON public.audit_logs;
CREATE POLICY "Merchants read store audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    private.current_user_role() = 'merchant'
    AND (
      (entity_type = 'order' AND EXISTS (
        SELECT 1 FROM public.orders o
        JOIN public.stores s ON s.id = o.store_id
        WHERE o.id = audit_logs.entity_id AND s.owner_id = auth.uid()
      ))
      OR (entity_type = 'store' AND EXISTS (
        SELECT 1 FROM public.stores s
        WHERE s.id = audit_logs.entity_id AND s.owner_id = auth.uid()
      ))
      OR (entity_type = 'payment_session' AND EXISTS (
        SELECT 1 FROM public.payment_sessions ps
        JOIN public.orders o ON o.id = ps.order_id
        JOIN public.stores s ON s.id = o.store_id
        WHERE ps.id = audit_logs.entity_id AND s.owner_id = auth.uid()
      ))
    )
  );

DROP POLICY IF EXISTS "Customers read own audit logs" ON public.audit_logs;
CREATE POLICY "Customers read own audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    actor_id = auth.uid()
    OR (
      entity_type IN ('order', 'invoice', 'payment_session')
      AND EXISTS (
        SELECT 1 FROM public.orders o
        WHERE (
          (audit_logs.entity_type = 'order' AND o.id = audit_logs.entity_id)
          OR (audit_logs.entity_type = 'invoice' AND o.id = (
            SELECT i.order_id FROM public.invoices i WHERE i.id = audit_logs.entity_id
          ))
          OR (audit_logs.entity_type = 'payment_session' AND o.id = (
            SELECT ps.order_id FROM public.payment_sessions ps WHERE ps.id = audit_logs.entity_id
          ))
        )
        AND o.customer_id = auth.uid()
      )
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- ATOMIC REFUND (service role only — full rollback of payment side effects)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.process_refund(
  p_order_id    UUID,
  p_reason      TEXT DEFAULT NULL,
  p_actor_id    UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order           RECORD;
  v_store           RECORD;
  v_session         RECORD;
  v_settlement      RECORD;
  v_treasury_id     UUID;
  v_merchant_wallet UUID;
  v_customer_wallet UUID;
  v_actor_role      public.user_role;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.status <> 'paid' THEN
    RAISE EXCEPTION 'Order is not refundable (status: %)', v_order.status;
  END IF;

  SELECT * INTO v_store FROM public.stores WHERE id = v_order.store_id;
  SELECT * INTO v_session FROM public.payment_sessions
  WHERE order_id = p_order_id AND status IN ('paid', 'completed')
  ORDER BY created_at DESC LIMIT 1 FOR UPDATE;

  SELECT * INTO v_settlement FROM public.settlements
  WHERE order_id = p_order_id AND status = 'completed'
  ORDER BY created_at DESC LIMIT 1;

  v_treasury_id := private.get_treasury_wallet_id();
  v_merchant_wallet := private.get_or_create_merchant_wallet(v_store.owner_id);

  SELECT w.id INTO v_customer_wallet
  FROM public.wallets w
  WHERE w.owner_type = 'customer' AND w.owner_id = v_order.customer_id AND w.is_primary = TRUE
  LIMIT 1;

  IF v_session.id IS NOT NULL THEN
    UPDATE public.payment_sessions
    SET status = 'refunded', updated_at = NOW()
    WHERE id = v_session.id;
  END IF;

  UPDATE public.invoices
  SET status = 'cancelled', updated_at = NOW()
  WHERE order_id = p_order_id;

  UPDATE public.orders
  SET status = 'refunded', updated_at = NOW()
  WHERE id = p_order_id;

  IF v_settlement.id IS NOT NULL THEN
    UPDATE public.settlements
    SET status = 'failed', updated_at = NOW()
    WHERE id = v_settlement.id;

    PERFORM private.record_wallet_transaction(
      v_treasury_id, 'refund', ABS(v_settlement.platform_fee), v_order.currency,
      'settlement', v_settlement.id, NULL,
      jsonb_build_object('order_id', p_order_id, 'reason', p_reason, 'direction', 'fee_reversal')
    );

    PERFORM private.record_wallet_transaction(
      v_merchant_wallet, 'refund', ABS(v_settlement.merchant_amount), v_order.currency,
      'settlement', v_settlement.id, NULL,
      jsonb_build_object('order_id', p_order_id, 'reason', p_reason, 'direction', 'payout_reversal')
    );
  END IF;

  IF v_customer_wallet IS NOT NULL THEN
    PERFORM private.record_wallet_transaction(
      v_customer_wallet, 'refund', v_order.subtotal, 'USD',
      'order', p_order_id, NULL,
      jsonb_build_object('reason', p_reason)
    );
  END IF;

  UPDATE public.customer_profiles
  SET total_orders = GREATEST(total_orders - 1, 0),
      total_spent_usd = GREATEST(total_spent_usd - v_order.subtotal, 0),
      updated_at = NOW()
  WHERE profile_id = v_order.customer_id;

  UPDATE public.merchant_profiles
  SET total_orders = GREATEST(total_orders - 1, 0),
      total_revenue_usd = GREATEST(total_revenue_usd - COALESCE(v_order.merchant_amount, 0), 0),
      updated_at = NOW()
  WHERE profile_id = v_store.owner_id;

  SELECT role INTO v_actor_role FROM public.profiles WHERE id = COALESCE(p_actor_id, v_order.customer_id);

  PERFORM private.write_audit_log(
    COALESCE(p_actor_id, v_order.customer_id),
    v_actor_role,
    'payment.refunded',
    'order',
    p_order_id,
    jsonb_build_object(
      'reason', p_reason,
      'settlement_id', v_settlement.id,
      'session_id', v_session.id
    )
  );

  RETURN jsonb_build_object(
    'order_id', p_order_id,
    'status', 'refunded',
    'settlement_id', v_settlement.id
  );
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.process_refund(UUID, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_refund(UUID, TEXT, UUID) TO service_role;

-- ═══════════════════════════════════════════════════════════════════════════════
-- AUDIT / SECURITY LOGGING HELPERS (standardized action names)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.log_audit_event(
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
BEGIN
  RETURN private.write_audit_log(
    auth.uid(),
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    p_action,
    p_entity_type,
    p_entity_id,
    p_metadata
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_audit_event(TEXT, TEXT, UUID, JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type  public.security_event_type,
  p_metadata    JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN private.log_security_event(
    p_event_type,
    auth.uid(),
    NULL,
    NULL,
    p_metadata
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_security_event(public.security_event_type, JSONB) TO authenticated, anon;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SCHEMA VALIDATION (run after migrations or in CI)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.validate_database_schema()
RETURNS TABLE (check_name TEXT, passed BOOLEAN, detail TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- RLS enabled on all public tables
  SELECT COUNT(*) INTO v_count
  FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = false;
  RETURN QUERY SELECT
    'rls_all_tables'::TEXT,
    v_count = 0,
    format('%s tables without RLS', v_count);

  -- Required reference data
  SELECT COUNT(*) INTO v_count FROM public.supported_currencies;
  RETURN QUERY SELECT
    'supported_currencies_seeded'::TEXT,
    v_count >= 8,
    format('%s currencies', v_count);

  SELECT COUNT(*) INTO v_count FROM public.fee_schedules;
  RETURN QUERY SELECT
    'fee_schedules_seeded'::TEXT,
    v_count >= 3,
    format('%s fee schedule rows', v_count);

  SELECT COUNT(*) INTO v_count FROM public.payment_methods WHERE is_active = TRUE;
  RETURN QUERY SELECT
    'payment_methods_seeded'::TEXT,
    v_count >= 5,
    format('%s active payment methods', v_count);

  -- Treasury wallet configured
  SELECT COUNT(*) INTO v_count FROM public.wallets WHERE owner_type = 'treasury';
  RETURN QUERY SELECT
    'treasury_wallet_exists'::TEXT,
    v_count = 1,
    format('%s treasury wallet rows (expected 1)', v_count);

  SELECT COUNT(*) INTO v_count FROM public.treasury_wallet;
  RETURN QUERY SELECT
    'treasury_config_exists'::TEXT,
    v_count = 1,
    format('%s treasury config rows (expected 1)', v_count);

  -- Core functions callable
  RETURN QUERY SELECT
    'complete_payment_exists'::TEXT,
    EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'complete_payment'
    ),
    'complete_payment RPC present'::TEXT;

  RETURN QUERY SELECT
    'create_store_checkout_exists'::TEXT,
    EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'create_store_checkout'
    ),
    'create_store_checkout RPC present'::TEXT;

  -- Required views
  RETURN QUERY SELECT
    'views_present'::TEXT,
    (
      SELECT COUNT(*) FROM pg_views
      WHERE schemaname = 'public'
        AND viewname IN ('customers', 'merchants', 'shopping_cart', 'payments', 'sessions', 'platform_fees')
    ) = 6,
    'All required views exist'::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_database_schema() TO service_role;
