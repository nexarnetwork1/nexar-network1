-- Production performance indexes for high-traffic payment and audit queries

CREATE INDEX IF NOT EXISTS idx_payment_sessions_status_expires_active
  ON public.payment_sessions (status, expires_at DESC)
  WHERE status IN ('waiting', 'waiting_confirmation', 'pending');

CREATE INDEX IF NOT EXISTS idx_payment_attempts_tx_hash
  ON public.payment_attempts (tx_hash)
  WHERE tx_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_settlements_status_created
  ON public.settlements (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_customer_created
  ON public.orders (customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_store_created
  ON public.orders (store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_logs_event_created
  ON public.security_logs (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created
  ON public.audit_logs (created_at DESC);
