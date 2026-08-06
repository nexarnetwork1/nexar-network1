/**
 * ATLAS Finance — domain types.
 * Financial Operating System — not accounting UI software.
 * Prefixed Finance* aggregates. Invoice/Payment/Wallet masters remain in payments/wallet.
 */

export type FinanceAccountType =
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "expense"
  | "cost_of_goods";

export type FinanceJournalStatus = "draft" | "posted" | "voided";

export type FinanceDocumentStatus =
  | "draft"
  | "pending"
  | "approved"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled"
  | "voided";

export type FinanceExpenseCategory =
  | "travel"
  | "salary"
  | "operations"
  | "marketing"
  | "inventory"
  | "utilities"
  | "custom";

export type FinanceTaxKind =
  | "vat"
  | "gst"
  | "sales_tax"
  | "withholding"
  | "custom";

export type FinancePaymentRail =
  | "cash"
  | "bank"
  | "card"
  | "wallet"
  | "nxr"
  | "crypto"
  | "apple_pay"
  | "google_pay"
  | "stripe"
  | "paypal"
  | "regional"
  | "other";

export type FinanceWorkspace = {
  id: string;
  business_id: string;
  base_currency: string;
  fiscal_year_start_month: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type FinanceAccount = {
  id: string;
  workspace_id: string;
  chart_id: string;
  code: string;
  name: string;
  account_type: FinanceAccountType;
  subtype: string | null;
  parent_id: string | null;
  currency: string | null;
  is_system: boolean;
  is_postable: boolean;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type FinanceJournal = {
  id: string;
  workspace_id: string;
  period_id: string | null;
  journal_number: string;
  status: FinanceJournalStatus;
  memo: string | null;
  source: string;
  source_ref_type: string | null;
  source_ref_id: string | null;
  currency: string;
  posted_at: string | null;
  posted_by: string | null;
  voided_at: string | null;
  voided_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type FinanceJournalEntry = {
  id: string;
  journal_id: string;
  workspace_id: string;
  account_id: string;
  cost_center_id: string | null;
  line_no: number;
  debit: number;
  credit: number;
  currency: string;
  base_debit: number;
  base_credit: number;
  exchange_rate: number;
  memo: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type FinanceExpense = {
  id: string;
  workspace_id: string;
  number: string;
  status: FinanceDocumentStatus;
  approval_status: string;
  category: FinanceExpenseCategory;
  custom_category: string | null;
  account_id: string | null;
  cost_center_id: string | null;
  amount: number;
  tax_amount: number;
  currency: string;
  incurred_on: string;
  vendor_name: string | null;
  payment_rail: FinancePaymentRail | null;
  journal_id: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type FinanceBudget = {
  id: string;
  workspace_id: string;
  name: string;
  period_kind: string;
  cost_center_id: string | null;
  account_id: string | null;
  starts_on: string;
  ends_on: string;
  amount: number;
  spent: number;
  currency: string;
  alert_threshold: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type FinanceTaxRate = {
  id: string;
  workspace_id: string;
  code: string;
  name: string;
  kind: FinanceTaxKind;
  rate: number;
  country_code: string | null;
  region_code: string | null;
  is_compound: boolean;
  is_active: boolean;
  effective_from: string | null;
  effective_to: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type FinanceTransaction = {
  id: string;
  workspace_id: string;
  number: string;
  direction: "inflow" | "outflow" | "transfer";
  amount: number;
  currency: string;
  base_amount: number;
  exchange_rate: number;
  payment_rail: FinancePaymentRail;
  status: string;
  journal_id: string | null;
  payment_session_id: string | null;
  invoice_id: string | null;
  wallet_transaction_id: string | null;
  occurred_at: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

/** Masters Finance consumes — never owns. */
export const FINANCE_CONSUMES = [
  "Business",
  "Invoice",
  "Payment",
  "Wallet",
  "LedgerEntry",
  "Order",
  "Settlement",
] as const;

export const STANDARD_COA: Array<{
  code: string;
  name: string;
  account_type: FinanceAccountType;
  subtype: string;
}> = [
  { code: "1000", name: "Cash", account_type: "asset", subtype: "cash" },
  { code: "1100", name: "Bank", account_type: "asset", subtype: "bank" },
  { code: "1200", name: "Accounts Receivable", account_type: "asset", subtype: "receivable" },
  { code: "1300", name: "Inventory Asset", account_type: "asset", subtype: "inventory" },
  { code: "2000", name: "Accounts Payable", account_type: "liability", subtype: "payable" },
  { code: "2100", name: "Tax Payable", account_type: "liability", subtype: "tax_payable" },
  { code: "3000", name: "Owner Equity", account_type: "equity", subtype: "capital" },
  { code: "3100", name: "Retained Earnings", account_type: "equity", subtype: "retained_earnings" },
  { code: "4000", name: "Sales Revenue", account_type: "revenue", subtype: "sales" },
  { code: "4100", name: "Other Income", account_type: "revenue", subtype: "other_income" },
  { code: "5000", name: "Cost of Goods Sold", account_type: "cost_of_goods", subtype: "cogs" },
  { code: "6000", name: "Operating Expenses", account_type: "expense", subtype: "operating" },
  { code: "6100", name: "Salaries", account_type: "expense", subtype: "salary" },
  { code: "6200", name: "Marketing", account_type: "expense", subtype: "marketing" },
  { code: "6300", name: "Utilities", account_type: "expense", subtype: "utilities" },
  { code: "6400", name: "Travel", account_type: "expense", subtype: "travel" },
];

export const FINANCE_EVENT_HANDLERS: Record<
  string,
  { action: "provision" | "post" | "reconcile" | "notify"; description: string }
> = {
  "business.created": {
    action: "provision",
    description: "Provision Finance workspace + standard COA",
  },
  "invoice.issued": {
    action: "post",
    description: "Optional accrual journal for issued invoice",
  },
  "invoice.paid": {
    action: "post",
    description: "Post receipt journal / transaction link",
  },
  "payment.confirmed": {
    action: "post",
    description: "Record finance transaction from payment rail",
  },
  "wallet.credited": {
    action: "reconcile",
    description: "Reconcile wallet credit into GL cash/bank",
  },
  "wallet.debited": {
    action: "reconcile",
    description: "Reconcile wallet debit into GL",
  },
  "settlement.completed": {
    action: "post",
    description: "Post settlement fees / marketplace commission",
  },
};

export type EnsureFinanceWorkspaceInput = {
  businessId: string;
  baseCurrency?: string;
  actorUserId?: string;
};

export type PostJournalInput = {
  workspaceId: string;
  memo?: string;
  source?: string;
  sourceRefType?: string;
  sourceRefId?: string;
  currency?: string;
  actorUserId?: string;
  lines: Array<{
    accountId: string;
    debit?: number;
    credit?: number;
    memo?: string;
    costCenterId?: string;
    exchangeRate?: number;
  }>;
};

export type CreateExpenseInput = {
  workspaceId: string;
  amount: number;
  currency?: string;
  category: FinanceExpenseCategory;
  customCategory?: string;
  incurredOn?: string;
  vendorName?: string;
  paymentRail?: FinancePaymentRail;
  accountId?: string;
  costCenterId?: string;
  taxAmount?: number;
  notes?: string;
  createdBy: string;
  postToLedger?: boolean;
};

export type CreateBudgetInput = {
  workspaceId: string;
  name: string;
  amount: number;
  currency?: string;
  periodKind?: string;
  startsOn: string;
  endsOn: string;
  costCenterId?: string;
  accountId?: string;
  alertThreshold?: number;
};

export type CalculateTaxInput = {
  workspaceId: string;
  taxRateId: string;
  taxableAmount: number;
  currency?: string;
  sourceRefType: string;
  sourceRefId?: string;
};
