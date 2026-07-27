-- Merchants can cancel unpaid orders for their store

CREATE OR REPLACE FUNCTION public.merchant_cancel_pending_order(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.stores
    WHERE id = v_order.store_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF v_order.status <> 'pending_payment' THEN
    RAISE EXCEPTION 'Order cannot be cancelled';
  END IF;

  UPDATE public.payment_sessions
  SET status = 'expired', updated_at = NOW()
  WHERE order_id = p_order_id AND status = 'waiting';

  UPDATE public.invoices
  SET status = 'cancelled', updated_at = NOW()
  WHERE order_id = p_order_id AND status IN ('pending', 'draft');

  UPDATE public.orders
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_order_id;

  PERFORM private.write_audit_log(
    auth.uid(),
    'merchant',
    'order.cancelled',
    'order',
    p_order_id,
    jsonb_build_object('previous_status', v_order.status, 'store_id', v_order.store_id)
  );

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.merchant_cancel_pending_order(UUID) TO authenticated;
