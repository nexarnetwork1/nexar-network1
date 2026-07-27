-- RLS audit: verify all public tables have RLS enabled
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Tables without RLS (should return zero rows in production)
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;

-- List all RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verify security definer functions are in private schema
SELECT
  n.nspname AS schema,
  p.proname AS function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prosecdef = true
  AND n.nspname NOT IN ('private', 'pg_catalog')
ORDER BY n.nspname, p.proname;
