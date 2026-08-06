/**
 * ATLAS Finance — double-entry ledger engine (pure).
 * Balances must equal; posted journals are immutable at the service layer.
 */

export type JournalLineDraft = {
  accountId: string;
  accountType?: string;
  debit?: number;
  credit?: number;
  exchangeRate?: number;
  memo?: string;
  costCenterId?: string;
};

export type BalancedJournalLine = {
  accountId: string;
  lineNo: number;
  debit: number;
  credit: number;
  baseDebit: number;
  baseCredit: number;
  exchangeRate: number;
  memo?: string;
  costCenterId?: string;
};

export type BalanceResult = {
  ok: boolean;
  totalDebit: number;
  totalCredit: number;
  difference: number;
  lines: BalancedJournalLine[];
  errors: string[];
};

const EPS = 1e-8;

function round8(n: number): number {
  return Math.round(n * 1e8) / 1e8;
}

/** Validate and balance journal lines (double entry). */
export function balanceJournalLines(lines: JournalLineDraft[]): BalanceResult {
  const errors: string[] = [];
  if (!lines.length) {
    return {
      ok: false,
      totalDebit: 0,
      totalCredit: 0,
      difference: 0,
      lines: [],
      errors: ["At least one journal line is required"],
    };
  }

  const balanced: BalancedJournalLine[] = [];
  let totalDebit = 0;
  let totalCredit = 0;

  lines.forEach((line, idx) => {
    const debit = round8(line.debit ?? 0);
    const credit = round8(line.credit ?? 0);
    const rate = line.exchangeRate && line.exchangeRate > 0 ? line.exchangeRate : 1;

    if (!line.accountId) errors.push(`Line ${idx + 1}: accountId required`);
    if (debit < 0 || credit < 0) errors.push(`Line ${idx + 1}: amounts must be >= 0`);
    if (debit > 0 && credit > 0) {
      errors.push(`Line ${idx + 1}: cannot have both debit and credit`);
    }
    if (debit === 0 && credit === 0) {
      errors.push(`Line ${idx + 1}: debit or credit required`);
    }

    totalDebit = round8(totalDebit + debit);
    totalCredit = round8(totalCredit + credit);

    balanced.push({
      accountId: line.accountId,
      lineNo: idx + 1,
      debit,
      credit,
      baseDebit: round8(debit * rate),
      baseCredit: round8(credit * rate),
      exchangeRate: rate,
      memo: line.memo,
      costCenterId: line.costCenterId,
    });
  });

  const difference = round8(totalDebit - totalCredit);
  if (Math.abs(difference) > EPS) {
    errors.push(
      `Journal unbalanced: debit ${totalDebit} != credit ${totalCredit} (diff ${difference})`,
    );
  }

  return {
    ok: errors.length === 0,
    totalDebit,
    totalCredit,
    difference,
    lines: balanced,
    errors,
  };
}

/** Natural sign for trial balance / BS / P&L rollups. */
export function accountNormalBalance(
  accountType: string,
): "debit" | "credit" {
  if (
    accountType === "asset" ||
    accountType === "expense" ||
    accountType === "cost_of_goods"
  ) {
    return "debit";
  }
  return "credit";
}

export function computeAccountBalance(input: {
  accountType: string;
  debitTotal: number;
  creditTotal: number;
}): number {
  const normal = accountNormalBalance(input.accountType);
  if (normal === "debit") {
    return round8(input.debitTotal - input.creditTotal);
  }
  return round8(input.creditTotal - input.debitTotal);
}

export type TrialBalanceRow = {
  accountId: string;
  code: string;
  name: string;
  accountType: string;
  debit: number;
  credit: number;
};

export function buildTrialBalance(
  rows: Array<{
    accountId: string;
    code: string;
    name: string;
    accountType: string;
    debitTotal: number;
    creditTotal: number;
  }>,
): { rows: TrialBalanceRow[]; totalDebit: number; totalCredit: number; balanced: boolean } {
  const mapped = rows.map((r) => {
    const bal = computeAccountBalance({
      accountType: r.accountType,
      debitTotal: r.debitTotal,
      creditTotal: r.creditTotal,
    });
    const normal = accountNormalBalance(r.accountType);
    return {
      accountId: r.accountId,
      code: r.code,
      name: r.name,
      accountType: r.accountType,
      debit: normal === "debit" && bal >= 0 ? bal : normal === "credit" && bal < 0 ? -bal : 0,
      credit: normal === "credit" && bal >= 0 ? bal : normal === "debit" && bal < 0 ? -bal : 0,
    };
  });
  const totalDebit = round8(mapped.reduce((s, r) => s + r.debit, 0));
  const totalCredit = round8(mapped.reduce((s, r) => s + r.credit, 0));
  return {
    rows: mapped,
    totalDebit,
    totalCredit,
    balanced: Math.abs(totalDebit - totalCredit) <= EPS,
  };
}

export type StatementSection = {
  label: string;
  amount: number;
};

export function buildIncomeStatement(input: {
  revenueTotal: number;
  cogsTotal: number;
  expenseTotal: number;
}): {
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netIncome: number;
} {
  const revenue = round8(input.revenueTotal);
  const cogs = round8(input.cogsTotal);
  const expenses = round8(input.expenseTotal);
  const grossProfit = round8(revenue - cogs);
  const netIncome = round8(grossProfit - expenses);
  return { revenue, cogs, grossProfit, expenses, netIncome };
}

export function buildBalanceSheet(input: {
  assets: number;
  liabilities: number;
  equity: number;
  netIncome: number;
}): {
  assets: number;
  liabilities: number;
  equity: number;
  balanced: boolean;
} {
  const assets = round8(input.assets);
  const liabilities = round8(input.liabilities);
  const equity = round8(input.equity + input.netIncome);
  return {
    assets,
    liabilities,
    equity,
    balanced: Math.abs(assets - (liabilities + equity)) <= EPS,
  };
}

export function calculateTaxAmount(
  taxableAmount: number,
  rate: number,
  compound = false,
  priorTax = 0,
): number {
  const base = compound ? taxableAmount + priorTax : taxableAmount;
  return round8(base * rate);
}

export function convertCurrency(
  amount: number,
  rate: number,
): number {
  return round8(amount * (rate > 0 ? rate : 1));
}

/** Simple health score 0–100 from liquidity / profitability signals. */
export function businessHealthScore(input: {
  netIncome: number;
  revenue: number;
  cashBalance: number;
  expenseTotal: number;
  budgetUtilization?: number;
}): number {
  let score = 50;
  if (input.revenue > 0) {
    const margin = input.netIncome / input.revenue;
    score += Math.max(-20, Math.min(25, margin * 100));
  }
  if (input.cashBalance > 0) score += 10;
  if (input.cashBalance < 0) score -= 15;
  if ((input.budgetUtilization ?? 0) > 1) score -= 10;
  if ((input.budgetUtilization ?? 0) > 0.9) score -= 5;
  return Math.max(0, Math.min(100, Math.round(score)));
}
