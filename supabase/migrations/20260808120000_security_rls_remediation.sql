-- Security remediation: tighten open RLS policies and protect authjs password hashes.
-- Additive only — drops permissive USING(true) policies; deny-by-default for anon/authenticated.
-- Service role (Auth.js adapter, server workers) continues to bypass RLS.

-- ---------------------------------------------------------------------------
-- 1. authjs_users — revoke client SELECT to prevent password hash exposure
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS authjs_users_self_select ON public.authjs_users;
REVOKE SELECT ON public.authjs_users FROM authenticated;

-- ---------------------------------------------------------------------------
-- 2. atlas_nxr_* — remove open SELECT policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS nxr_accounts_select ON public.atlas_nxr_accounts;
DROP POLICY IF EXISTS nxr_tx_select ON public.atlas_nxr_transactions;
DROP POLICY IF EXISTS nxr_rewards_select ON public.atlas_nxr_rewards;
DROP POLICY IF EXISTS nxr_loyalty_select ON public.atlas_nxr_loyalty_accounts;

REVOKE ALL ON public.atlas_nxr_accounts FROM anon, authenticated;
REVOKE ALL ON public.atlas_nxr_transactions FROM anon, authenticated;
REVOKE ALL ON public.atlas_nxr_rewards FROM anon, authenticated;
REVOKE ALL ON public.atlas_nxr_loyalty_accounts FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. atlas_mobile_* — remove open SELECT policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS mobile_devices_select ON public.atlas_mobile_devices;
DROP POLICY IF EXISTS mobile_sessions_select ON public.atlas_mobile_sessions;
DROP POLICY IF EXISTS mobile_push_tokens_select ON public.atlas_mobile_push_tokens;
DROP POLICY IF EXISTS mobile_offline_select ON public.atlas_mobile_offline_queue;
DROP POLICY IF EXISTS mobile_sync_cursors_select ON public.atlas_mobile_sync_cursors;

REVOKE ALL ON public.atlas_mobile_devices FROM anon, authenticated;
REVOKE ALL ON public.atlas_mobile_sessions FROM anon, authenticated;
REVOKE ALL ON public.atlas_mobile_push_tokens FROM anon, authenticated;
REVOKE ALL ON public.atlas_mobile_offline_queue FROM anon, authenticated;
REVOKE ALL ON public.atlas_mobile_sync_cursors FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. atlas_finance_* — remove open SELECT policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS finance_workspaces_select ON public.atlas_finance_workspaces;
DROP POLICY IF EXISTS finance_charts_select ON public.atlas_finance_charts;
DROP POLICY IF EXISTS finance_accounts_select ON public.atlas_finance_accounts;
DROP POLICY IF EXISTS finance_journals_select ON public.atlas_finance_journals;
DROP POLICY IF EXISTS finance_journal_entries_select ON public.atlas_finance_journal_entries;
DROP POLICY IF EXISTS finance_expenses_select ON public.atlas_finance_expenses;
DROP POLICY IF EXISTS finance_budgets_select ON public.atlas_finance_budgets;
DROP POLICY IF EXISTS finance_transactions_select ON public.atlas_finance_transactions;
DROP POLICY IF EXISTS finance_audit_select ON public.atlas_finance_audit_logs;

REVOKE ALL ON public.atlas_finance_workspaces FROM anon, authenticated;
REVOKE ALL ON public.atlas_finance_charts FROM anon, authenticated;
REVOKE ALL ON public.atlas_finance_accounts FROM anon, authenticated;
REVOKE ALL ON public.atlas_finance_journals FROM anon, authenticated;
REVOKE ALL ON public.atlas_finance_journal_entries FROM anon, authenticated;
REVOKE ALL ON public.atlas_finance_expenses FROM anon, authenticated;
REVOKE ALL ON public.atlas_finance_budgets FROM anon, authenticated;
REVOKE ALL ON public.atlas_finance_transactions FROM anon, authenticated;
REVOKE ALL ON public.atlas_finance_audit_logs FROM anon, authenticated;

COMMENT ON TABLE public.authjs_users IS
  'Auth.js adapter users. Client SELECT revoked — password hash never exposed via PostgREST.';
