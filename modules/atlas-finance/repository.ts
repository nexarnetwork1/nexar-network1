import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  FinanceAccount,
  FinanceBudget,
  FinanceExpense,
  FinanceJournal,
  FinanceJournalEntry,
  FinanceTaxRate,
  FinanceTransaction,
  FinanceWorkspace,
} from "./types";
import type { BalancedJournalLine } from "./ledger";

function db() {
  return createAdminClient();
}

export async function getWorkspaceByBusinessId(
  businessId: string,
): Promise<FinanceWorkspace | null> {
  const { data } = await db()
    .from("atlas_finance_workspaces")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();
  return (data as FinanceWorkspace | null) ?? null;
}

export async function getWorkspaceById(
  workspaceId: string,
): Promise<FinanceWorkspace | null> {
  const { data } = await db()
    .from("atlas_finance_workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle();
  return (data as FinanceWorkspace | null) ?? null;
}

export async function createWorkspace(input: {
  businessId: string;
  baseCurrency: string;
}): Promise<FinanceWorkspace> {
  const { data, error } = await db()
    .from("atlas_finance_workspaces")
    .insert({
      business_id: input.businessId,
      base_currency: input.baseCurrency,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create finance workspace");
  return data as FinanceWorkspace;
}

export async function createChart(workspaceId: string): Promise<{ id: string }> {
  const { data, error } = await db()
    .from("atlas_finance_charts")
    .insert({
      workspace_id: workspaceId,
      name: "Standard Chart of Accounts",
      is_default: true,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create chart");
  return data as { id: string };
}

export async function seedAccounts(
  workspaceId: string,
  chartId: string,
  accounts: Array<{
    code: string;
    name: string;
    account_type: string;
    subtype: string;
  }>,
): Promise<FinanceAccount[]> {
  const { data, error } = await db()
    .from("atlas_finance_accounts")
    .insert(
      accounts.map((a) => ({
        workspace_id: workspaceId,
        chart_id: chartId,
        code: a.code,
        name: a.name,
        account_type: a.account_type,
        subtype: a.subtype,
        is_system: true,
        is_postable: true,
      })),
    )
    .select("*");
  if (error || !data) throw new Error(error?.message ?? "Failed to seed accounts");
  return data as FinanceAccount[];
}

export async function listAccounts(
  workspaceId: string,
): Promise<FinanceAccount[]> {
  const { data } = await db()
    .from("atlas_finance_accounts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true)
    .order("code");
  return (data as FinanceAccount[]) ?? [];
}

export async function getAccountByCode(
  workspaceId: string,
  code: string,
): Promise<FinanceAccount | null> {
  const { data } = await db()
    .from("atlas_finance_accounts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("code", code)
    .maybeSingle();
  return (data as FinanceAccount | null) ?? null;
}

export async function nextJournalNumber(workspaceId: string): Promise<string> {
  const { count } = await db()
    .from("atlas_finance_journals")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  const n = (count ?? 0) + 1;
  return `JRN-${String(n).padStart(6, "0")}`;
}

export async function nextDocNumber(
  table: string,
  workspaceId: string,
  prefix: string,
): Promise<string> {
  const { count } = await db()
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  const n = (count ?? 0) + 1;
  return `${prefix}-${String(n).padStart(6, "0")}`;
}

export async function insertPostedJournal(input: {
  workspaceId: string;
  journalNumber: string;
  memo?: string;
  source: string;
  sourceRefType?: string;
  sourceRefId?: string;
  currency: string;
  actorUserId?: string;
  lines: BalancedJournalLine[];
}): Promise<{ journal: FinanceJournal; entries: FinanceJournalEntry[] }> {
  const { data: journal, error } = await db()
    .from("atlas_finance_journals")
    .insert({
      workspace_id: input.workspaceId,
      journal_number: input.journalNumber,
      status: "posted",
      memo: input.memo ?? null,
      source: input.source,
      source_ref_type: input.sourceRefType ?? null,
      source_ref_id: input.sourceRefId ?? null,
      currency: input.currency,
      posted_at: new Date().toISOString(),
      posted_by: input.actorUserId ?? null,
    })
    .select("*")
    .single();
  if (error || !journal) throw new Error(error?.message ?? "Failed to post journal");

  const { data: entries, error: entryError } = await db()
    .from("atlas_finance_journal_entries")
    .insert(
      input.lines.map((l) => ({
        journal_id: journal.id,
        workspace_id: input.workspaceId,
        account_id: l.accountId,
        cost_center_id: l.costCenterId ?? null,
        line_no: l.lineNo,
        debit: l.debit,
        credit: l.credit,
        currency: input.currency,
        base_debit: l.baseDebit,
        base_credit: l.baseCredit,
        exchange_rate: l.exchangeRate,
        memo: l.memo ?? null,
      })),
    )
    .select("*");
  if (entryError || !entries) {
    throw new Error(entryError?.message ?? "Failed to insert journal entries");
  }

  for (const line of input.lines) {
    await upsertLedgerBalance({
      workspaceId: input.workspaceId,
      accountId: line.accountId,
      debit: line.baseDebit,
      credit: line.baseCredit,
      currency: input.currency,
    });
  }

  return {
    journal: journal as FinanceJournal,
    entries: entries as FinanceJournalEntry[],
  };
}

async function upsertLedgerBalance(input: {
  workspaceId: string;
  accountId: string;
  debit: number;
  credit: number;
  currency: string;
}): Promise<void> {
  const { data: existing } = await db()
    .from("atlas_finance_ledger_balances")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("account_id", input.accountId)
    .is("period_id", null)
    .eq("currency", input.currency)
    .maybeSingle();

  if (existing) {
    const row = existing as {
      id: string;
      debit_total: number;
      credit_total: number;
    };
    const debitTotal = Number(row.debit_total) + input.debit;
    const creditTotal = Number(row.credit_total) + input.credit;
    await db()
      .from("atlas_finance_ledger_balances")
      .update({
        debit_total: debitTotal,
        credit_total: creditTotal,
        balance: debitTotal - creditTotal,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    return;
  }

  await db().from("atlas_finance_ledger_balances").insert({
    workspace_id: input.workspaceId,
    account_id: input.accountId,
    period_id: null,
    debit_total: input.debit,
    credit_total: input.credit,
    balance: input.debit - input.credit,
    currency: input.currency,
  });
}

export async function listLedgerBalances(workspaceId: string) {
  const { data } = await db()
    .from("atlas_finance_ledger_balances")
    .select("*")
    .eq("workspace_id", workspaceId);
  return data ?? [];
}

export async function createExpenseRecord(input: {
  workspaceId: string;
  number: string;
  amount: number;
  currency: string;
  category: string;
  customCategory?: string;
  incurredOn: string;
  vendorName?: string;
  paymentRail?: string;
  accountId?: string;
  costCenterId?: string;
  taxAmount: number;
  notes?: string;
  createdBy: string;
  journalId?: string;
}): Promise<FinanceExpense> {
  const { data, error } = await db()
    .from("atlas_finance_expenses")
    .insert({
      workspace_id: input.workspaceId,
      number: input.number,
      status: "approved",
      category: input.category,
      custom_category: input.customCategory ?? null,
      account_id: input.accountId ?? null,
      cost_center_id: input.costCenterId ?? null,
      amount: input.amount,
      tax_amount: input.taxAmount,
      currency: input.currency,
      incurred_on: input.incurredOn,
      vendor_name: input.vendorName ?? null,
      payment_rail: input.paymentRail ?? null,
      journal_id: input.journalId ?? null,
      notes: input.notes ?? null,
      created_by: input.createdBy,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create expense");
  return data as FinanceExpense;
}

export async function createBudgetRecord(input: {
  workspaceId: string;
  name: string;
  amount: number;
  currency: string;
  periodKind: string;
  startsOn: string;
  endsOn: string;
  costCenterId?: string;
  accountId?: string;
  alertThreshold: number;
}): Promise<FinanceBudget> {
  const { data, error } = await db()
    .from("atlas_finance_budgets")
    .insert({
      workspace_id: input.workspaceId,
      name: input.name,
      period_kind: input.periodKind,
      cost_center_id: input.costCenterId ?? null,
      account_id: input.accountId ?? null,
      starts_on: input.startsOn,
      ends_on: input.endsOn,
      amount: input.amount,
      currency: input.currency,
      alert_threshold: input.alertThreshold,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create budget");
  return data as FinanceBudget;
}

export async function listBudgets(workspaceId: string): Promise<FinanceBudget[]> {
  const { data } = await db()
    .from("atlas_finance_budgets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("starts_on", { ascending: false });
  return (data as FinanceBudget[]) ?? [];
}

export async function updateBudgetSpent(
  budgetId: string,
  spent: number,
): Promise<FinanceBudget> {
  const { data, error } = await db()
    .from("atlas_finance_budgets")
    .update({ spent, updated_at: new Date().toISOString() })
    .eq("id", budgetId)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to update budget");
  return data as FinanceBudget;
}

export async function getTaxRate(
  taxRateId: string,
): Promise<FinanceTaxRate | null> {
  const { data } = await db()
    .from("atlas_finance_tax_rates")
    .select("*")
    .eq("id", taxRateId)
    .maybeSingle();
  return (data as FinanceTaxRate | null) ?? null;
}

export async function createTaxRateRecord(input: {
  workspaceId: string;
  code: string;
  name: string;
  kind: string;
  rate: number;
  countryCode?: string;
}): Promise<FinanceTaxRate> {
  const { data, error } = await db()
    .from("atlas_finance_tax_rates")
    .insert({
      workspace_id: input.workspaceId,
      code: input.code,
      name: input.name,
      kind: input.kind,
      rate: input.rate,
      country_code: input.countryCode ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create tax rate");
  return data as FinanceTaxRate;
}

export async function insertTaxCalculation(input: {
  workspaceId: string;
  taxRateId: string;
  sourceRefType: string;
  sourceRefId?: string;
  taxableAmount: number;
  taxAmount: number;
  currency: string;
}): Promise<void> {
  await db().from("atlas_finance_tax_calculations").insert({
    workspace_id: input.workspaceId,
    tax_rate_id: input.taxRateId,
    source_ref_type: input.sourceRefType,
    source_ref_id: input.sourceRefId ?? null,
    taxable_amount: input.taxableAmount,
    tax_amount: input.taxAmount,
    currency: input.currency,
  });
}

export async function createTransactionRecord(input: {
  workspaceId: string;
  number: string;
  direction: string;
  amount: number;
  currency: string;
  baseAmount: number;
  exchangeRate: number;
  paymentRail: string;
  status?: string;
  journalId?: string;
  paymentSessionId?: string;
  invoiceId?: string;
  walletTransactionId?: string;
  metadata?: Record<string, unknown>;
}): Promise<FinanceTransaction> {
  const { data, error } = await db()
    .from("atlas_finance_transactions")
    .insert({
      workspace_id: input.workspaceId,
      number: input.number,
      direction: input.direction,
      amount: input.amount,
      currency: input.currency,
      base_amount: input.baseAmount,
      exchange_rate: input.exchangeRate,
      payment_rail: input.paymentRail,
      status: input.status ?? "completed",
      journal_id: input.journalId ?? null,
      payment_session_id: input.paymentSessionId ?? null,
      invoice_id: input.invoiceId ?? null,
      wallet_transaction_id: input.walletTransactionId ?? null,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create transaction");
  return data as FinanceTransaction;
}

export async function createRefundRecord(input: {
  workspaceId: string;
  number: string;
  amount: number;
  currency: string;
  invoiceId?: string;
  paymentSessionId?: string;
  reason?: string;
  createdBy?: string;
}): Promise<{ id: string; number: string }> {
  const { data, error } = await db()
    .from("atlas_finance_refunds")
    .insert({
      workspace_id: input.workspaceId,
      number: input.number,
      status: "paid",
      amount: input.amount,
      currency: input.currency,
      invoice_id: input.invoiceId ?? null,
      payment_session_id: input.paymentSessionId ?? null,
      reason: input.reason ?? null,
      processed_at: new Date().toISOString(),
      created_by: input.createdBy ?? null,
    })
    .select("id, number")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create refund");
  return data as { id: string; number: string };
}

export async function insertReportSnapshot(input: {
  workspaceId: string;
  reportType: string;
  payload: Record<string, unknown>;
  generatedBy?: string;
}): Promise<void> {
  await db().from("atlas_finance_report_snapshots").insert({
    workspace_id: input.workspaceId,
    report_type: input.reportType,
    payload: input.payload,
    generated_by: input.generatedBy ?? null,
  });
}

export async function writeFinanceAudit(input: {
  workspaceId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await db().from("atlas_finance_audit_logs").insert({
    workspace_id: input.workspaceId ?? null,
    action: input.action,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    actor_user_id: input.actorUserId ?? null,
    payload: input.payload ?? {},
  });
}
