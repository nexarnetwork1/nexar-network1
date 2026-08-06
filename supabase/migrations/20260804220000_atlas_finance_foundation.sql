-- ATLAS Finance foundation (additive, backward-compatible)
-- Financial Operating System — NOT accounting UI software.
-- Does NOT duplicate Invoice / Payment / Wallet masters.
-- Orchestrates GL, journals, expenses, tax, budgets, reports over existing money rails.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE public.finance_account_type AS ENUM (
  'asset', 'liability', 'equity', 'revenue', 'expense', 'cost_of_goods'
);

CREATE TYPE public.finance_account_subtype AS ENUM (
  'cash', 'bank', 'receivable', 'inventory', 'fixed_asset', 'other_asset',
  'payable', 'tax_payable', 'loan', 'other_liability',
  'capital', 'retained_earnings', 'other_equity',
  'sales', 'other_income',
  'operating', 'salary', 'marketing', 'utilities', 'travel', 'cogs', 'other_expense'
);

CREATE TYPE public.finance_journal_status AS ENUM (
  'draft', 'posted', 'voided'
);

CREATE TYPE public.finance_document_status AS ENUM (
  'draft', 'pending', 'approved', 'partially_paid', 'paid', 'overdue', 'cancelled', 'voided'
);

CREATE TYPE public.finance_expense_category AS ENUM (
  'travel', 'salary', 'operations', 'marketing', 'inventory', 'utilities', 'custom'
);

CREATE TYPE public.finance_tax_kind AS ENUM (
  'vat', 'gst', 'sales_tax', 'withholding', 'custom'
);

CREATE TYPE public.finance_period_status AS ENUM (
  'open', 'closed', 'locked'
);

CREATE TYPE public.finance_budget_period AS ENUM (
  'monthly', 'quarterly', 'annual', 'custom'
);

CREATE TYPE public.finance_payment_rail AS ENUM (
  'cash', 'bank', 'card', 'wallet', 'nxr', 'crypto',
  'apple_pay', 'google_pay', 'stripe', 'paypal', 'regional', 'other'
);

CREATE TYPE public.finance_subscription_source AS ENUM (
  'atlas_plan', 'business_plan', 'app', 'marketplace', 'custom'
);

CREATE TYPE public.finance_approval_status AS ENUM (
  'none', 'pending', 'approved', 'rejected'
);

-- ---------------------------------------------------------------------------
-- Workspace (per business)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_finance_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  base_currency TEXT NOT NULL DEFAULT 'USD',
  fiscal_year_start_month SMALLINT NOT NULL DEFAULT 1 CHECK (fiscal_year_start_month BETWEEN 1 AND 12),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_workspaces_business
  ON public.atlas_finance_workspaces(business_id);

-- ---------------------------------------------------------------------------
-- Chart of accounts + accounts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_finance_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_finance_workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Standard Chart of Accounts',
  is_default BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, name)
);

CREATE TABLE IF NOT EXISTS public.atlas_finance_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_finance_workspaces(id) ON DELETE CASCADE,
  chart_id UUID NOT NULL REFERENCES public.atlas_finance_charts(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  account_type public.finance_account_type NOT NULL,
  subtype public.finance_account_subtype,
  parent_id UUID REFERENCES public.atlas_finance_accounts(id) ON DELETE SET NULL,
  currency TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  is_postable BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, code)
);

CREATE INDEX IF NOT EXISTS idx_finance_accounts_workspace
  ON public.atlas_finance_accounts(workspace_id, account_type);
CREATE INDEX IF NOT EXISTS idx_finance_accounts_chart
  ON public.atlas_finance_accounts(chart_id);

-- ---------------------------------------------------------------------------
-- Cost centers & financial periods
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_finance_cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_finance_workspaces(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  department TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, code)
);

CREATE TABLE IF NOT EXISTS public.atlas_finance_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_finance_workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  status public.finance_period_status NOT NULL DEFAULT 'open',
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, starts_on, ends_on),
  CHECK (ends_on >= starts_on)
);

-- ---------------------------------------------------------------------------
-- Journals + double-entry lines (immutable once posted)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_finance_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_finance_workspaces(id) ON DELETE CASCADE,
  period_id UUID REFERENCES public.atlas_finance_periods(id) ON DELETE SET NULL,
  journal_number TEXT NOT NULL,
  status public.finance_journal_status NOT NULL DEFAULT 'draft',
  memo TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  source_ref_type TEXT,
  source_ref_id UUID,
  currency TEXT NOT NULL DEFAULT 'USD',
  posted_at TIMESTAMPTZ,
  posted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  voided_at TIMESTAMPTZ,
  voided_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, journal_number)
);

CREATE INDEX IF NOT EXISTS idx_finance_journals_workspace
  ON public.atlas_finance_journals(workspace_id, status, posted_at DESC);

CREATE TABLE IF NOT EXISTS public.atlas_finance_journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES public.atlas_finance_journals(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.atlas_finance_workspaces(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.atlas_finance_accounts(id) ON DELETE RESTRICT,
  cost_center_id UUID REFERENCES public.atlas_finance_cost_centers(id) ON DELETE SET NULL,
  line_no INTEGER NOT NULL,
  debit NUMERIC(20, 8) NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit NUMERIC(20, 8) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  base_debit NUMERIC(20, 8) NOT NULL DEFAULT 0,
  base_credit NUMERIC(20, 8) NOT NULL DEFAULT 0,
  exchange_rate NUMERIC(20, 10) NOT NULL DEFAULT 1,
  memo TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (journal_id, line_no),
  CHECK (NOT (debit > 0 AND credit > 0)),
  CHECK (debit > 0 OR credit > 0)
);

CREATE INDEX IF NOT EXISTS idx_finance_journal_entries_account
  ON public.atlas_finance_journal_entries(account_id, journal_id);
CREATE INDEX IF NOT EXISTS idx_finance_journal_entries_workspace
  ON public.atlas_finance_journal_entries(workspace_id);

-- ---------------------------------------------------------------------------
-- Ledger balances (materialized from posted journals — not a second truth for payments)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_finance_ledger_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_finance_workspaces(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.atlas_finance_accounts(id) ON DELETE CASCADE,
  period_id UUID REFERENCES public.atlas_finance_periods(id) ON DELETE SET NULL,
  debit_total NUMERIC(20, 8) NOT NULL DEFAULT 0,
  credit_total NUMERIC(20, 8) NOT NULL DEFAULT 0,
  balance NUMERIC(20, 8) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, account_id, period_id, currency)
);

-- ---------------------------------------------------------------------------
-- Tax engine
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_finance_tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_finance_workspaces(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  kind public.finance_tax_kind NOT NULL DEFAULT 'vat',
  rate NUMERIC(10, 6) NOT NULL CHECK (rate >= 0),
  country_code TEXT,
  region_code TEXT,
  is_compound BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  effective_from DATE,
  effective_to DATE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, code)
);

CREATE TABLE IF NOT EXISTS public.atlas_finance_tax_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_finance_workspaces(id) ON DELETE CASCADE,
  tax_rate_id UUID REFERENCES public.atlas_finance_tax_rates(id) ON DELETE SET NULL,
  source_ref_type TEXT NOT NULL,
  source_ref_id UUID,
  taxable_amount NUMERIC(20, 8) NOT NULL,
  tax_amount NUMERIC(20, 8) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Quotations, POs, expenses, income (Finance-owned docs; Invoice master stays in payments)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_finance_quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_finance_workspaces(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  status public.finance_document_status NOT NULL DEFAULT 'draft',
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  subtotal NUMERIC(20, 8) NOT NULL DEFAULT 0,
  tax_total NUMERIC(20, 8) NOT NULL DEFAULT 0,
  total NUMERIC(20, 8) NOT NULL DEFAULT 0,
  valid_until DATE,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, number)
);

CREATE TABLE IF NOT EXISTS public.atlas_finance_purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_finance_workspaces(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  status public.finance_document_status NOT NULL DEFAULT 'draft',
  approval_status public.finance_approval_status NOT NULL DEFAULT 'none',
  vendor_name TEXT,
  vendor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  subtotal NUMERIC(20, 8) NOT NULL DEFAULT 0,
  tax_total NUMERIC(20, 8) NOT NULL DEFAULT 0,
  total NUMERIC(20, 8) NOT NULL DEFAULT 0,
  expected_at DATE,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, number)
);

CREATE TABLE IF NOT EXISTS public.atlas_finance_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_finance_workspaces(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  status public.finance_document_status NOT NULL DEFAULT 'draft',
  approval_status public.finance_approval_status NOT NULL DEFAULT 'none',
  category public.finance_expense_category NOT NULL DEFAULT 'operations',
  custom_category TEXT,
  account_id UUID REFERENCES public.atlas_finance_accounts(id) ON DELETE SET NULL,
  cost_center_id UUID REFERENCES public.atlas_finance_cost_centers(id) ON DELETE SET NULL,
  amount NUMERIC(20, 8) NOT NULL CHECK (amount >= 0),
  tax_amount NUMERIC(20, 8) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  incurred_on DATE NOT NULL DEFAULT CURRENT_DATE,
  vendor_name TEXT,
  payment_rail public.finance_payment_rail,
  journal_id UUID REFERENCES public.atlas_finance_journals(id) ON DELETE SET NULL,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, number)
);

CREATE INDEX IF NOT EXISTS idx_finance_expenses_workspace
  ON public.atlas_finance_expenses(workspace_id, incurred_on DESC);

CREATE TABLE IF NOT EXISTS public.atlas_finance_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_finance_workspaces(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  status public.finance_document_status NOT NULL DEFAULT 'draft',
  account_id UUID REFERENCES public.atlas_finance_accounts(id) ON DELETE SET NULL,
  amount NUMERIC(20, 8) NOT NULL CHECK (amount >= 0),
  tax_amount NUMERIC(20, 8) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  received_on DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT,
  payment_rail public.finance_payment_rail,
  -- Optional link to existing invoice master (payments context)
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  journal_id UUID REFERENCES public.atlas_finance_journals(id) ON DELETE SET NULL,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, number)
);

-- ---------------------------------------------------------------------------
-- Credit / debit notes, refunds (Finance docs; may reference invoices/payments)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_finance_credit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_finance_workspaces(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  status public.finance_document_status NOT NULL DEFAULT 'draft',
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount NUMERIC(20, 8) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  reason TEXT,
  journal_id UUID REFERENCES public.atlas_finance_journals(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, number)
);

CREATE TABLE IF NOT EXISTS public.atlas_finance_debit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_finance_workspaces(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  status public.finance_document_status NOT NULL DEFAULT 'draft',
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount NUMERIC(20, 8) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  reason TEXT,
  journal_id UUID REFERENCES public.atlas_finance_journals(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, number)
);

CREATE TABLE IF NOT EXISTS public.atlas_finance_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_finance_workspaces(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  status public.finance_document_status NOT NULL DEFAULT 'pending',
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  payment_session_id UUID REFERENCES public.payment_sessions(id) ON DELETE SET NULL,
  amount NUMERIC(20, 8) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_rail public.finance_payment_rail,
  journal_id UUID REFERENCES public.atlas_finance_journals(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, number)
);

-- ---------------------------------------------------------------------------
-- Recurring invoices / expenses, subscriptions, installments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_finance_recurring_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_finance_workspaces(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount NUMERIC(20, 8) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  interval_days INTEGER NOT NULL DEFAULT 30 CHECK (interval_days > 0),
  next_run_on DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.atlas_finance_recurring_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_finance_workspaces(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  category public.finance_expense_category NOT NULL DEFAULT 'operations',
  amount NUMERIC(20, 8) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  interval_days INTEGER NOT NULL DEFAULT 30 CHECK (interval_days > 0),
  next_run_on DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.atlas_finance_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_finance_workspaces(id) ON DELETE CASCADE,
  source public.finance_subscription_source NOT NULL DEFAULT 'custom',
  source_ref_id UUID,
  plan_code TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  amount NUMERIC(20, 8) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  interval_days INTEGER NOT NULL DEFAULT 30,
  auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
  current_period_start DATE,
  current_period_end DATE,
  cancelled_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.atlas_finance_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_finance_workspaces(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  sequence_no INTEGER NOT NULL,
  amount NUMERIC(20, 8) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  due_on DATE NOT NULL,
  status public.finance_document_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, invoice_id, sequence_no)
);

-- ---------------------------------------------------------------------------
-- Budgets
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_finance_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_finance_workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  period_kind public.finance_budget_period NOT NULL DEFAULT 'monthly',
  cost_center_id UUID REFERENCES public.atlas_finance_cost_centers(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.atlas_finance_accounts(id) ON DELETE SET NULL,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  amount NUMERIC(20, 8) NOT NULL CHECK (amount >= 0),
  spent NUMERIC(20, 8) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  alert_threshold NUMERIC(5, 4) NOT NULL DEFAULT 0.9,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_on >= starts_on)
);

CREATE INDEX IF NOT EXISTS idx_finance_budgets_workspace
  ON public.atlas_finance_budgets(workspace_id, starts_on);

-- ---------------------------------------------------------------------------
-- Transactions (Finance orchestration links — not payment_sessions masters)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_finance_workspaces(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inflow', 'outflow', 'transfer')),
  amount NUMERIC(20, 8) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  base_amount NUMERIC(20, 8) NOT NULL DEFAULT 0,
  exchange_rate NUMERIC(20, 10) NOT NULL DEFAULT 1,
  payment_rail public.finance_payment_rail NOT NULL DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'completed',
  journal_id UUID REFERENCES public.atlas_finance_journals(id) ON DELETE SET NULL,
  payment_session_id UUID REFERENCES public.payment_sessions(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  wallet_transaction_id UUID,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, number)
);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_workspace
  ON public.atlas_finance_transactions(workspace_id, occurred_at DESC);

-- ---------------------------------------------------------------------------
-- Report snapshots & AI insights (derived — not source of truth)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_finance_report_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_finance_workspaces(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  period_id UUID REFERENCES public.atlas_finance_periods(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_finance_reports_workspace
  ON public.atlas_finance_report_snapshots(workspace_id, report_type, generated_at DESC);

CREATE TABLE IF NOT EXISTS public.atlas_finance_ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_finance_workspaces(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  score NUMERIC(8, 4),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Immutable financial audit log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_finance_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.atlas_finance_workspaces(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_audit_workspace
  ON public.atlas_finance_audit_logs(workspace_id, created_at DESC);

-- Prevent updates/deletes on audit logs
CREATE OR REPLACE FUNCTION public.atlas_finance_deny_audit_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'atlas_finance_audit_logs is immutable';
END;
$$;

DROP TRIGGER IF EXISTS trg_finance_audit_no_update ON public.atlas_finance_audit_logs;
CREATE TRIGGER trg_finance_audit_no_update
  BEFORE UPDATE OR DELETE ON public.atlas_finance_audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.atlas_finance_deny_audit_mutation();

-- ---------------------------------------------------------------------------
-- Seed helper: standard COA codes (applied per workspace in app layer)
-- Documented here for reference; service seeds on ensureWorkspace.
-- 1000 Cash, 1100 Bank, 1200 AR, 2000 AP, 2100 Tax Payable,
-- 3000 Equity, 4000 Sales, 5000 COGS, 6000 OpEx, 6100 Salary, 6200 Marketing
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- RLS (service role / admin client for foundation; tighten with membership later)
-- ---------------------------------------------------------------------------
ALTER TABLE public.atlas_finance_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_finance_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_finance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_finance_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_finance_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_finance_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_finance_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_finance_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY finance_workspaces_select ON public.atlas_finance_workspaces
  FOR SELECT USING (true);
CREATE POLICY finance_charts_select ON public.atlas_finance_charts
  FOR SELECT USING (true);
CREATE POLICY finance_accounts_select ON public.atlas_finance_accounts
  FOR SELECT USING (true);
CREATE POLICY finance_journals_select ON public.atlas_finance_journals
  FOR SELECT USING (true);
CREATE POLICY finance_journal_entries_select ON public.atlas_finance_journal_entries
  FOR SELECT USING (true);
CREATE POLICY finance_expenses_select ON public.atlas_finance_expenses
  FOR SELECT USING (true);
CREATE POLICY finance_budgets_select ON public.atlas_finance_budgets
  FOR SELECT USING (true);
CREATE POLICY finance_transactions_select ON public.atlas_finance_transactions
  FOR SELECT USING (true);
CREATE POLICY finance_audit_select ON public.atlas_finance_audit_logs
  FOR SELECT USING (true);
