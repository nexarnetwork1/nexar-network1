-- Use cancelled status when customer cancels a waiting payment session

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
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_session_id;

  RETURN TRUE;
END;
$$;
