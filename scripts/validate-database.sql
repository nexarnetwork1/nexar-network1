-- Database validation script
-- Run in Supabase SQL Editor or via psql after applying all migrations.
--
-- Usage:
--   SELECT * FROM public.validate_database_schema() ORDER BY check_name;
--   -- All rows should have passed = true

\echo '=== Schema Validation ==='
SELECT
  check_name,
  CASE WHEN passed THEN 'PASS' ELSE 'FAIL' END AS result,
  detail
FROM public.validate_database_schema()
ORDER BY check_name;

\echo ''
\echo '=== Tables Without RLS (should be empty) ==='
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false
ORDER BY tablename;

\echo ''
\echo '=== Public Tables ==='
SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

\echo ''
\echo '=== Views ==='
SELECT viewname FROM pg_views WHERE schemaname = 'public' ORDER BY viewname;

\echo ''
\echo '=== Reference Data Counts ==='
SELECT 'supported_currencies' AS entity, COUNT(*)::TEXT AS count FROM public.supported_currencies
UNION ALL SELECT 'supported_fiat', COUNT(*)::TEXT FROM public.supported_fiat
UNION ALL SELECT 'supported_crypto', COUNT(*)::TEXT FROM public.supported_crypto
UNION ALL SELECT 'payment_methods', COUNT(*)::TEXT FROM public.payment_methods
UNION ALL SELECT 'fee_schedules', COUNT(*)::TEXT FROM public.fee_schedules
UNION ALL SELECT 'exchange_rates', COUNT(*)::TEXT FROM public.exchange_rates
UNION ALL SELECT 'wallets (treasury)', COUNT(*)::TEXT FROM public.wallets WHERE owner_type = 'treasury';

\echo ''
\echo '=== Fee Schedule Defaults ==='
SELECT payment_type, base_rate, effective_from
FROM public.fee_schedules
ORDER BY payment_type, effective_from DESC;

\echo ''
\echo '=== Security Definer Functions (non-private schema) ==='
SELECT n.nspname AS schema, p.proname AS function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prosecdef = true
  AND n.nspname NOT IN ('private', 'pg_catalog')
ORDER BY n.nspname, p.proname;
