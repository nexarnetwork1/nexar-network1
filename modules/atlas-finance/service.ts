import "server-only";

import { randomUUID } from "node:crypto";
import { publishDomainEvent, type DomainEvent } from "@/domains";
import type {
  AtlasFinancePort,
  FinanceWorkspaceRecord,
  FinanceJournalRecord,
  FinanceExpenseRecord,
  FinanceBudgetRecord,
} from "@/domains/contracts/ports";
import { createFinanceAiStub, FINANCE_AI_ACTIONS } from "./ai";
import {
  balanceJournalLines,
  buildBalanceSheet,
  buildIncomeStatement,
  buildTrialBalance,
  businessHealthScore,
  calculateTaxAmount,
  computeAccountBalance,
} from "./ledger";
import {
  createBudgetRecord,
  createExpenseRecord,
  createRefundRecord,
  createTaxRateRecord,
  createTransactionRecord,
  createWorkspace,
  createChart,
  getAccountByCode,
  getTaxRate,
  getWorkspaceByBusinessId,
  getWorkspaceById,
  insertPostedJournal,
  insertReportSnapshot,
  insertTaxCalculation,
  listAccounts,
  listBudgets,
  listLedgerBalances,
  nextDocNumber,
  nextJournalNumber,
  seedAccounts,
  updateBudgetSpent,
  writeFinanceAudit,
} from "./repository";
import {
  STANDARD_COA,
  type CreateBudgetInput,
  type CreateExpenseInput,
  type EnsureFinanceWorkspaceInput,
  type FinanceBudget,
  type FinanceExpense,
  type FinanceJournal,
  type FinanceWorkspace,
  type PostJournalInput,
  type CalculateTaxInput,
} from "./types";
import {
  calculateTaxSchema,
  createBudgetSchema,
  createExpenseSchema,
  ensureFinanceWorkspaceSchema,
  postJournalSchema,
} from "./validators";

async function emit(
  name: DomainEvent["name"],
  input: {
    actorId: string | null;
    businessId: string | null;
    payload: Record<string, unknown>;
  },
) {
  await publishDomainEvent({
    id: randomUUID(),
    name,
    occurredAt: new Date(),
    actorId: input.actorId,
    businessId: input.businessId,
    payload: input.payload,
    correlationId: randomUUID(),
  });
}

function toWorkspaceRecord(w: FinanceWorkspace): FinanceWorkspaceRecord {
  return {
    id: w.id,
    businessId: w.business_id,
    baseCurrency: w.base_currency,
    fiscalYearStartMonth: w.fiscal_year_start_month,
    isActive: w.is_active,
  };
}

function toJournalRecord(j: FinanceJournal): FinanceJournalRecord {
  return {
    id: j.id,
    workspaceId: j.workspace_id,
    journalNumber: j.journal_number,
    status: j.status,
    currency: j.currency,
    postedAt: j.posted_at ? new Date(j.posted_at) : null,
  };
}

function toExpenseRecord(e: FinanceExpense): FinanceExpenseRecord {
  return {
    id: e.id,
    workspaceId: e.workspace_id,
    number: e.number,
    category: e.category,
    amount: Number(e.amount),
    currency: e.currency,
    status: e.status,
  };
}

function toBudgetRecord(b: FinanceBudget): FinanceBudgetRecord {
  return {
    id: b.id,
    workspaceId: b.workspace_id,
    name: b.name,
    amount: Number(b.amount),
    spent: Number(b.spent),
    currency: b.currency,
    startsOn: b.starts_on,
    endsOn: b.ends_on,
  };
}

export async function ensureFinanceWorkspace(
  input: EnsureFinanceWorkspaceInput,
): Promise<FinanceWorkspaceRecord> {
  ensureFinanceWorkspaceSchema.parse(input);
  const existing = await getWorkspaceByBusinessId(input.businessId);
  if (existing) return toWorkspaceRecord(existing);

  const workspace = await createWorkspace({
    businessId: input.businessId,
    baseCurrency: input.baseCurrency ?? "USD",
  });
  const chart = await createChart(workspace.id);
  await seedAccounts(workspace.id, chart.id, STANDARD_COA);
  await createTaxRateRecord({
    workspaceId: workspace.id,
    code: "VAT-STD",
    name: "Standard VAT",
    kind: "vat",
    rate: 0.15,
  });

  await writeFinanceAudit({
    workspaceId: workspace.id,
    action: "workspace_provisioned",
    entityType: "workspace",
    entityId: workspace.id,
    actorUserId: input.actorUserId,
  });

  await emit("finance.workspace_created", {
    actorId: input.actorUserId ?? null,
    businessId: input.businessId,
    payload: { workspaceId: workspace.id },
  });

  return toWorkspaceRecord(workspace);
}

export async function getFinanceWorkspace(
  businessId: string,
): Promise<FinanceWorkspaceRecord | null> {
  const w = await getWorkspaceByBusinessId(businessId);
  return w ? toWorkspaceRecord(w) : null;
}

export async function postJournal(
  input: PostJournalInput,
): Promise<FinanceJournalRecord> {
  postJournalSchema.parse(input);
  const workspace = await getWorkspaceById(input.workspaceId);
  if (!workspace) throw new Error("Finance workspace not found");

  const balanced = balanceJournalLines(input.lines);
  if (!balanced.ok) {
    throw new Error(balanced.errors.join("; "));
  }

  const journalNumber = await nextJournalNumber(input.workspaceId);
  const { journal } = await insertPostedJournal({
    workspaceId: input.workspaceId,
    journalNumber,
    memo: input.memo,
    source: input.source ?? "manual",
    sourceRefType: input.sourceRefType,
    sourceRefId: input.sourceRefId,
    currency: input.currency ?? workspace.base_currency,
    actorUserId: input.actorUserId,
    lines: balanced.lines,
  });

  await writeFinanceAudit({
    workspaceId: input.workspaceId,
    action: "journal_posted",
    entityType: "journal",
    entityId: journal.id,
    actorUserId: input.actorUserId,
    payload: {
      journalNumber,
      totalDebit: balanced.totalDebit,
      totalCredit: balanced.totalCredit,
    },
  });

  await emit("finance.transaction_completed", {
    actorId: input.actorUserId ?? null,
    businessId: workspace.business_id,
    payload: {
      workspaceId: input.workspaceId,
      journalId: journal.id,
      journalNumber,
    },
  });

  return toJournalRecord(journal);
}

export async function createExpense(
  input: CreateExpenseInput,
): Promise<FinanceExpenseRecord> {
  createExpenseSchema.parse(input);
  const workspace = await getWorkspaceById(input.workspaceId);
  if (!workspace) throw new Error("Finance workspace not found");

  let journalId: string | undefined;
  if (input.postToLedger !== false) {
    const expenseAccount =
      (input.accountId
        ? (await listAccounts(input.workspaceId)).find((a) => a.id === input.accountId)
        : null) ?? (await getAccountByCode(input.workspaceId, "6000"));
    const cashAccount = await getAccountByCode(input.workspaceId, "1000");
    if (expenseAccount && cashAccount) {
      const journal = await postJournal({
        workspaceId: input.workspaceId,
        memo: `Expense ${input.category}`,
        source: "expense",
        currency: input.currency ?? workspace.base_currency,
        actorUserId: input.createdBy,
        lines: [
          { accountId: expenseAccount.id, debit: input.amount },
          { accountId: cashAccount.id, credit: input.amount },
        ],
      });
      journalId = journal.id;
    }
  }

  const number = await nextDocNumber(
    "atlas_finance_expenses",
    input.workspaceId,
    "EXP",
  );
  const expense = await createExpenseRecord({
    workspaceId: input.workspaceId,
    number,
    amount: input.amount,
    currency: input.currency ?? workspace.base_currency,
    category: input.category,
    customCategory: input.customCategory,
    incurredOn: input.incurredOn ?? new Date().toISOString().slice(0, 10),
    vendorName: input.vendorName,
    paymentRail: input.paymentRail,
    accountId: input.accountId,
    costCenterId: input.costCenterId,
    taxAmount: input.taxAmount ?? 0,
    notes: input.notes,
    createdBy: input.createdBy,
    journalId,
  });

  const budgets = await listBudgets(input.workspaceId);
  for (const budget of budgets) {
    const starts = new Date(budget.starts_on);
    const ends = new Date(budget.ends_on);
    const incurred = new Date(expense.incurred_on);
    if (incurred >= starts && incurred <= ends) {
      const spent = Number(budget.spent) + input.amount;
      const updated = await updateBudgetSpent(budget.id, spent);
      if (spent > Number(budget.amount) * Number(budget.alert_threshold)) {
        await emit("finance.budget_exceeded", {
          actorId: input.createdBy,
          businessId: workspace.business_id,
          payload: {
            budgetId: budget.id,
            spent,
            amount: Number(budget.amount),
          },
        });
      }
      void updated;
    }
  }

  await writeFinanceAudit({
    workspaceId: input.workspaceId,
    action: "expense_created",
    entityType: "expense",
    entityId: expense.id,
    actorUserId: input.createdBy,
  });

  await emit("finance.expense_created", {
    actorId: input.createdBy,
    businessId: workspace.business_id,
    payload: { expenseId: expense.id, amount: input.amount, category: input.category },
  });

  return toExpenseRecord(expense);
}

export async function createBudget(
  input: CreateBudgetInput,
): Promise<FinanceBudgetRecord> {
  createBudgetSchema.parse(input);
  const budget = await createBudgetRecord({
    workspaceId: input.workspaceId,
    name: input.name,
    amount: input.amount,
    currency: input.currency ?? "USD",
    periodKind: input.periodKind ?? "monthly",
    startsOn: input.startsOn,
    endsOn: input.endsOn,
    costCenterId: input.costCenterId,
    accountId: input.accountId,
    alertThreshold: input.alertThreshold ?? 0.9,
  });
  return toBudgetRecord(budget);
}

export async function calculateTax(input: CalculateTaxInput): Promise<{
  taxAmount: number;
  taxableAmount: number;
  rate: number;
}> {
  calculateTaxSchema.parse(input);
  const rate = await getTaxRate(input.taxRateId);
  if (!rate || !rate.is_active) throw new Error("Tax rate not found");

  const taxAmount = calculateTaxAmount(
    input.taxableAmount,
    Number(rate.rate),
    rate.is_compound,
  );
  await insertTaxCalculation({
    workspaceId: input.workspaceId,
    taxRateId: input.taxRateId,
    sourceRefType: input.sourceRefType,
    sourceRefId: input.sourceRefId,
    taxableAmount: input.taxableAmount,
    taxAmount,
    currency: input.currency ?? "USD",
  });

  const workspace = await getWorkspaceById(input.workspaceId);
  await emit("finance.tax_calculated", {
    actorId: null,
    businessId: workspace?.business_id ?? null,
    payload: {
      taxRateId: input.taxRateId,
      taxAmount,
      taxableAmount: input.taxableAmount,
    },
  });

  return { taxAmount, taxableAmount: input.taxableAmount, rate: Number(rate.rate) };
}

export async function processRefund(input: {
  workspaceId: string;
  amount: number;
  currency?: string;
  invoiceId?: string;
  paymentSessionId?: string;
  reason?: string;
  actorUserId?: string;
}): Promise<{ refundId: string; number: string }> {
  const number = await nextDocNumber(
    "atlas_finance_refunds",
    input.workspaceId,
    "REF",
  );
  const refund = await createRefundRecord({
    workspaceId: input.workspaceId,
    number,
    amount: input.amount,
    currency: input.currency ?? "USD",
    invoiceId: input.invoiceId,
    paymentSessionId: input.paymentSessionId,
    reason: input.reason,
    createdBy: input.actorUserId,
  });

  const workspace = await getWorkspaceById(input.workspaceId);
  await emit("finance.refund_processed", {
    actorId: input.actorUserId ?? null,
    businessId: workspace?.business_id ?? null,
    payload: { refundId: refund.id, amount: input.amount },
  });

  return { refundId: refund.id, number: refund.number };
}

export async function generateFinancialReports(workspaceId: string): Promise<{
  trialBalance: ReturnType<typeof buildTrialBalance>;
  incomeStatement: ReturnType<typeof buildIncomeStatement>;
  balanceSheet: ReturnType<typeof buildBalanceSheet>;
  healthScore: number;
}> {
  const accounts = await listAccounts(workspaceId);
  const balances = await listLedgerBalances(workspaceId);
  const byAccount = new Map(
    (balances as Array<{ account_id: string; debit_total: number; credit_total: number }>).map(
      (b) => [b.account_id, b],
    ),
  );

  const rows = accounts.map((a) => {
    const bal = byAccount.get(a.id);
    return {
      accountId: a.id,
      code: a.code,
      name: a.name,
      accountType: a.account_type,
      debitTotal: Number(bal?.debit_total ?? 0),
      creditTotal: Number(bal?.credit_total ?? 0),
    };
  });

  const trialBalance = buildTrialBalance(rows);

  let revenueTotal = 0;
  let cogsTotal = 0;
  let expenseTotal = 0;
  let assets = 0;
  let liabilities = 0;
  let equity = 0;
  let cashBalance = 0;

  for (const row of rows) {
    const bal = computeAccountBalance({
      accountType: row.accountType,
      debitTotal: row.debitTotal,
      creditTotal: row.creditTotal,
    });
    if (row.accountType === "revenue") revenueTotal += bal;
    if (row.accountType === "cost_of_goods") cogsTotal += bal;
    if (row.accountType === "expense") expenseTotal += bal;
    if (row.accountType === "asset") assets += bal;
    if (row.accountType === "liability") liabilities += bal;
    if (row.accountType === "equity") equity += bal;
    if (row.code === "1000" || row.code === "1100") cashBalance += bal;
  }

  const incomeStatement = buildIncomeStatement({
    revenueTotal,
    cogsTotal,
    expenseTotal,
  });
  const balanceSheet = buildBalanceSheet({
    assets,
    liabilities,
    equity,
    netIncome: incomeStatement.netIncome,
  });
  const healthScore = businessHealthScore({
    netIncome: incomeStatement.netIncome,
    revenue: incomeStatement.revenue,
    cashBalance,
    expenseTotal,
  });

  await insertReportSnapshot({
    workspaceId,
    reportType: "bundle",
    payload: { trialBalance, incomeStatement, balanceSheet, healthScore },
  });

  return { trialBalance, incomeStatement, balanceSheet, healthScore };
}

export async function recordPaymentConfirmed(input: {
  businessId: string;
  amount: number;
  currency?: string;
  paymentSessionId?: string;
  invoiceId?: string;
  actorUserId?: string;
}): Promise<void> {
  const workspace = await ensureFinanceWorkspace({
    businessId: input.businessId,
    actorUserId: input.actorUserId,
  });
  const cash = await getAccountByCode(workspace.id, "1000");
  const ar = await getAccountByCode(workspace.id, "1200");
  const sales = await getAccountByCode(workspace.id, "4000");
  if (!cash || !sales) return;

  // If AR exists, clear AR; otherwise credit sales directly (cash sale)
  const creditAccount = ar ?? sales;
  const journal = await postJournal({
    workspaceId: workspace.id,
    memo: "Payment confirmed",
    source: "payment",
    sourceRefType: "payment_session",
    sourceRefId: input.paymentSessionId,
    currency: input.currency ?? workspace.baseCurrency,
    actorUserId: input.actorUserId,
    lines: [
      { accountId: cash.id, debit: input.amount },
      { accountId: creditAccount.id, credit: input.amount },
    ],
  });

  const number = await nextDocNumber(
    "atlas_finance_transactions",
    workspace.id,
    "TXN",
  );
  await createTransactionRecord({
    workspaceId: workspace.id,
    number,
    direction: "inflow",
    amount: input.amount,
    currency: input.currency ?? workspace.baseCurrency,
    baseAmount: input.amount,
    exchangeRate: 1,
    paymentRail: "other",
    journalId: journal.id,
    paymentSessionId: input.paymentSessionId,
    invoiceId: input.invoiceId,
  });

  if (input.invoiceId) {
    await emit("finance.invoice_paid", {
      actorId: input.actorUserId ?? null,
      businessId: input.businessId,
      payload: {
        invoiceId: input.invoiceId,
        amount: input.amount,
        journalId: journal.id,
      },
    });
  }
}

export async function handleFinanceDomainEvent(input: {
  name: string;
  actorId: string | null;
  businessId: string | null;
  payload: Record<string, unknown>;
}): Promise<void> {
  if (input.name === "business.created" && input.businessId) {
    await ensureFinanceWorkspace({
      businessId: input.businessId,
      actorUserId: input.actorId ?? undefined,
      baseCurrency: (input.payload.baseCurrency as string | undefined) ?? "USD",
    });
    return;
  }

  if (
    (input.name === "payment.confirmed" || input.name === "invoice.paid") &&
    input.businessId
  ) {
    const amount = Number(input.payload.amount ?? input.payload.total ?? 0);
    if (amount > 0) {
      await recordPaymentConfirmed({
        businessId: input.businessId,
        amount,
        currency: input.payload.currency as string | undefined,
        paymentSessionId: input.payload.paymentSessionId as string | undefined,
        invoiceId: input.payload.invoiceId as string | undefined,
        actorUserId: input.actorId ?? undefined,
      });
    }
  }
}

export function createAtlasFinancePort(): AtlasFinancePort {
  return {
    async ensureWorkspace(input) {
      return ensureFinanceWorkspace(input);
    },
    async getWorkspace(businessId) {
      return getFinanceWorkspace(businessId);
    },
    async postJournal(input) {
      return postJournal(input);
    },
    async createExpense(input) {
      return createExpense(input as CreateExpenseInput);
    },
    async createBudget(input) {
      return createBudget(input);
    },
    async calculateTax(input) {
      return calculateTax(input);
    },
    async generateReports(workspaceId) {
      return generateFinancialReports(workspaceId);
    },
  };
}

export { createFinanceAiStub, FINANCE_AI_ACTIONS };
export {
  balanceJournalLines,
  buildTrialBalance,
  buildIncomeStatement,
  buildBalanceSheet,
  businessHealthScore,
  calculateTaxAmount,
};
