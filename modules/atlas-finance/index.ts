/**
 * ATLAS Finance — Financial Operating System.
 * Orchestrates GL / journals / tax / budgets over Invoice/Payment/Wallet masters.
 */

export type {
  FinanceWorkspace,
  FinanceAccount,
  FinanceJournal,
  FinanceJournalEntry,
  FinanceExpense,
  FinanceBudget,
  FinanceTaxRate,
  FinanceTransaction,
  FinanceAccountType,
  FinanceExpenseCategory,
  FinancePaymentRail,
  EnsureFinanceWorkspaceInput,
  PostJournalInput,
  CreateExpenseInput,
  CreateBudgetInput,
  CalculateTaxInput,
} from "./types";

export {
  FINANCE_CONSUMES,
  FINANCE_EVENT_HANDLERS,
  STANDARD_COA,
} from "./types";

export {
  balanceJournalLines,
  buildTrialBalance,
  buildIncomeStatement,
  buildBalanceSheet,
  businessHealthScore,
  calculateTaxAmount,
  convertCurrency,
  accountNormalBalance,
  computeAccountBalance,
} from "./ledger";

export {
  ensureFinanceWorkspace,
  getFinanceWorkspace,
  postJournal,
  createExpense,
  createBudget,
  calculateTax,
  processRefund,
  generateFinancialReports,
  recordPaymentConfirmed,
  handleFinanceDomainEvent,
  createAtlasFinancePort,
  createFinanceAiStub,
  FINANCE_AI_ACTIONS,
} from "./service";

export { registerAtlasFinanceEventHandlers } from "./events";

export {
  ensureFinanceWorkspaceSchema,
  postJournalSchema,
  createExpenseSchema,
  createBudgetSchema,
  calculateTaxSchema,
} from "./validators";
