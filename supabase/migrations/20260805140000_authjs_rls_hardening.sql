-- Auth.js tables RLS hardening
-- Fixes Supabase Security Advisor critical findings: RLS disabled on
-- public.authjs_users, public.authjs_accounts, public.authjs_sessions,
-- public.authjs_verification_tokens.
--
-- Design constraints:
--   • The Auth.js adapter (lib/auth/authjs-adapter.ts) uses the service-role
--     client exclusively. service_role bypasses RLS entirely, so enabling RLS
--     does NOT break authentication.
--   • The Prisma adapter (DATABASE_URL path) also connects as service_role and
--     is equally unaffected.
--   • No anon or authenticated-JWT client should ever read/write these tables
--     directly — they are internal Auth.js infrastructure. All access is via
--     server-side adapter callbacks.
--   • We add a narrow self-read policy on authjs_users and authjs_sessions so
--     that a logged-in user can introspect their own record via PostgREST if
--     needed (profile page, active sessions panel). All write operations remain
--     service-role only.
--
-- Idempotent: policies are dropped before (re)creation; ALTER TABLE … ENABLE
-- ROW LEVEL SECURITY is a no-op when already enabled.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Enable RLS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.authjs_users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authjs_accounts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authjs_sessions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authjs_verification_tokens  ENABLE ROW LEVEL SECURITY;

-- Force RLS even for the table owner (postgres role).  This ensures no
-- accidental bypass via the postgres/supabase_admin role in migrations other
-- than service_role adapter calls.
ALTER TABLE public.authjs_users                FORCE ROW LEVEL SECURITY;
ALTER TABLE public.authjs_accounts             FORCE ROW LEVEL SECURITY;
ALTER TABLE public.authjs_sessions             FORCE ROW LEVEL SECURITY;
ALTER TABLE public.authjs_verification_tokens  FORCE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. authjs_users
-- ─────────────────────────────────────────────────────────────────────────────
-- The authjs_users.id is a UUID generated independently of auth.users.id.
-- Auth.js synchronises the two IDs: when a user is created via the adapter the
-- same UUID is inserted into both tables (see auth.ts createUser event).
-- Therefore auth.uid() == authjs_users.id for a logged-in user.

DROP POLICY IF EXISTS authjs_users_self_select  ON public.authjs_users;
DROP POLICY IF EXISTS authjs_users_no_anon      ON public.authjs_users;

-- Authenticated users may read their own row only (password field is excluded
-- via column-level security is not available in Supabase yet, but the
-- application never exposes the password hash via API responses).
CREATE POLICY authjs_users_self_select
  ON public.authjs_users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- All mutations are reserved for the service-role adapter; deny for everyone
-- else (service_role bypasses RLS so no explicit grant is needed).
-- No INSERT / UPDATE / DELETE policy → authenticated clients cannot write.

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. authjs_accounts
-- ─────────────────────────────────────────────────────────────────────────────
-- OAuth provider tokens must never be directly readable by the client — they
-- contain access/refresh tokens. Deny all access for anon and authenticated
-- roles. service_role (the adapter) bypasses RLS.

DROP POLICY IF EXISTS authjs_accounts_self_select ON public.authjs_accounts;

-- Intentionally no policies: deny-by-default for anon + authenticated.
-- service_role bypasses, so the adapter continues to work.

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. authjs_sessions
-- ─────────────────────────────────────────────────────────────────────────────
-- Session tokens are sensitive. Authenticated users may read their own active
-- sessions (supports the "active sessions" panel in the profile UI). No writes
-- from the client side.

DROP POLICY IF EXISTS authjs_sessions_self_select ON public.authjs_sessions;

CREATE POLICY authjs_sessions_self_select
  ON public.authjs_sessions
  FOR SELECT
  TO authenticated
  USING ("userId" = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. authjs_verification_tokens
-- ─────────────────────────────────────────────────────────────────────────────
-- Verification tokens are single-use secrets. No client access at all.
-- The adapter uses service_role for all operations on this table.

-- No policies: full deny-by-default for anon + authenticated.
-- service_role bypasses RLS and can INSERT / SELECT / DELETE freely.

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Revoke direct table grants from anon / authenticated
--    (belt-and-suspenders: RLS alone suffices but explicit REVOKE ensures
--    even a permissive future policy cannot accidentally expose data)
-- ─────────────────────────────────────────────────────────────────────────────
REVOKE ALL ON public.authjs_users               FROM anon, authenticated;
REVOKE ALL ON public.authjs_accounts            FROM anon, authenticated;
REVOKE ALL ON public.authjs_sessions            FROM anon, authenticated;
REVOKE ALL ON public.authjs_verification_tokens FROM anon, authenticated;

-- Re-grant the narrow SELECT needed for the self-read policies above.
-- Without this, the policy USING clause evaluates but the query is still
-- rejected at the privilege check layer.
GRANT SELECT ON public.authjs_users    TO authenticated;
GRANT SELECT ON public.authjs_sessions TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Comments
-- ─────────────────────────────────────────────────────────────────────────────
COMMENT ON TABLE public.authjs_users IS
  'Auth.js adapter users table. RLS enabled — all writes via service_role only.';
COMMENT ON TABLE public.authjs_accounts IS
  'Auth.js OAuth provider accounts. RLS enabled — fully deny-by-default for client roles; service_role only.';
COMMENT ON TABLE public.authjs_sessions IS
  'Auth.js database sessions. RLS enabled — authenticated users may SELECT own rows; service_role manages all writes.';
COMMENT ON TABLE public.authjs_verification_tokens IS
  'Auth.js email verification tokens. RLS enabled — fully deny-by-default; service_role only.';
