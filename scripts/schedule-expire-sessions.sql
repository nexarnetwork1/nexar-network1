-- Schedule payment session expiry (requires pg_cron extension on Supabase Pro)
-- Alternative: call GET /api/cron/expire-sessions with Authorization: Bearer CRON_SECRET

-- Enable pg_cron if available:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- SELECT cron.schedule(
--   'expire-stale-payment-sessions',
--   '* * * * *',
--   $$SELECT public.expire_stale_payment_sessions()$$
-- );

-- Manual test:
SELECT public.expire_stale_payment_sessions() AS expired_count;
