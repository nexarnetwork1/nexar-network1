# ATLAS Finance — Financial Operating System

**Financial engine of ATLAS by NEXAR NETWORK**

> ATLAS Finance is **not** accounting software.  
> It is the financial operating system: every material money event should flow through Finance GL / tax / budgets / reports.

---

## Mission

Double-entry ledger, tax, budgets, and financial statements — orchestrating existing **Invoice**, **Payment**, and **Wallet** masters (never duplicating them).

---

## Architecture

| Layer | Location |
|-------|----------|
| Bounded context | `atlasFinance` |
| Pillar module | `modules/atlas-finance/` |
| Database | `atlas_finance_*` |
| Port | `AtlasFinancePort` |
| Double-entry engine | `modules/atlas-finance/ledger.ts` (pure) |
| Payment rails (consumed) | `modules/payments`, `modules/invoices`, `modules/wallet` |

### Ownership (charter)

| Aggregate | Owner |
|-----------|--------|
| Invoice, Payment, Escrow, Settlement | `payments` |
| Wallet, LedgerEntry (`wallet_transactions`), Withdrawal | `wallet` |
| FinanceWorkspace, COA, Journals, Expenses, Tax, Budgets, FinanceTransaction… | `atlasFinance` |

---

## Root Entities

| Entity | Table / note |
|--------|----------------|
| FinanceWorkspace | `atlas_finance_workspaces` |
| FinanceChartOfAccounts | `atlas_finance_charts` |
| FinanceAccount | `atlas_finance_accounts` |
| FinanceJournal / FinanceJournalEntry | journals + lines |
| FinanceLedger | `atlas_finance_ledger_balances` (materialized) |
| FinanceTransaction | orchestration link to payment_session / invoice |
| FinanceQuotation / PurchaseOrder | purchasing docs |
| FinanceExpense / FinanceIncome | expense & income docs |
| FinanceTaxRate / TaxCalculation | tax engine |
| FinanceCostCenter / Budget / Period | planning |
| FinanceCreditNote / DebitNote / Refund | adjustments |
| FinanceRecurring* / Subscription / Installment | recurring billing |
| FinanceReportSnapshot / AiInsight / AuditLog | reports & immutable audit |

**Invoice master** remains `public.invoices`. Finance may reference `invoice_id` FKs.

### Standard COA (seeded per workspace)

`1000` Cash · `1100` Bank · `1200` AR · `2000` AP · `2100` Tax Payable · `3000` Equity · `4000` Sales · `5000` COGS · `6000+` Expenses

---

## Double-entry engine

`balanceJournalLines` rejects unbalanced journals. Posted journals update ledger balances. Reports:

- Trial Balance
- Income Statement (P&L)
- Balance Sheet
- Business Health Score (AI stub companion)

---

## Domain Events

| Event | When |
|-------|------|
| `finance.workspace_created` | Workspace + COA provisioned |
| `finance.invoice_created` | Reserved for Finance invoice projections |
| `finance.invoice_paid` | Payment posted into GL |
| `finance.expense_created` | Expense recorded |
| `finance.budget_exceeded` | Spend crosses alert threshold |
| `finance.transaction_completed` | Journal posted |
| `finance.subscription_renewed` | Subscription cycle |
| `finance.refund_processed` | Refund recorded |
| `finance.tax_calculated` | Tax engine run |

Inbound: `business.created` (provision), `payment.confirmed` / `invoice.paid` (post), wallet & settlement reconcile hooks registered.

---

## Permissions (`finance:*`)

`workspace:read/manage` · `accounts:read/manage` · `journal:post/read` · `expense:create/approve/read` · `budget:*` · `tax:*` · `reports:read/premium` · `audit:read` · `refund:process` · `po:manage` · `subscription:manage`

Role mapping: Owner / Finance Admin (business owner) · Accountant (manager) · Auditor (admin audit read) · Employee (expense create limited).

---

## Port (`AtlasFinancePort`)

`ensureWorkspace` · `getWorkspace` · `postJournal` · `createExpense` · `createBudget` · `calculateTax` · `generateReports`

REST / GraphQL / SDK / webhooks consume this port — not module internals.

---

## Integrations

| Module | Integration |
|--------|-------------|
| Wallet | Reconcile credits/debits into cash/bank accounts |
| Marketplace | Settlement commission posting |
| Apps | App subscription billing via `FinanceSubscription` |
| Connect / Pulse / AI | Events + `FINANCE_AI_ACTIONS` stubs |
| Payments / Invoices | Source of truth for payment sessions & invoices |

---

## Security

- Immutable `atlas_finance_audit_logs` (DB trigger blocks UPDATE/DELETE)
- Posted journals not rewritten (void path later)
- Permission isolation via `finance:*` matrix
- Fraud detection stub in AI actions

---

## Related

| Document | Purpose |
|----------|---------|
| [ATLAS.md](./ATLAS.md) | Platform constitution |
| Migration | `supabase/migrations/20260804220000_atlas_finance_foundation.sql` |
| Payments rails | `modules/payments`, `modules/invoices` |
