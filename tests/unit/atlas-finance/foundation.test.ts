import { describe, expect, it } from "vitest";
import {
  FINANCE_CONSUMES,
  FINANCE_EVENT_HANDLERS,
  STANDARD_COA,
} from "@/modules/atlas-finance/types";
import {
  balanceJournalLines,
  buildBalanceSheet,
  buildIncomeStatement,
  buildTrialBalance,
  businessHealthScore,
  calculateTaxAmount,
} from "@/modules/atlas-finance/ledger";
import {
  createFinanceAiStub,
  FINANCE_AI_ACTIONS,
} from "@/modules/atlas-finance/ai";
import {
  ensureFinanceWorkspaceSchema,
  postJournalSchema,
  createExpenseSchema,
} from "@/modules/atlas-finance/validators";
import {
  ownerOf,
  BOUNDED_CONTEXTS,
  DOMAIN_EVENTS,
  hasPermission,
  permissionsForPlatformRole,
  ATLAS_FINANCE_MODULE,
} from "@/domains";
import { ATLAS_ROOT_MODULES } from "@/config/atlas-nav";

describe("ATLAS Finance bounded context", () => {
  it("registers atlasFinance as financial OS", () => {
    expect(BOUNDED_CONTEXTS.atlasFinance.id).toBe("atlas_finance");
    expect(BOUNDED_CONTEXTS.atlasFinance.atlasModule).toBe("finance");
    expect(BOUNDED_CONTEXTS.atlasFinance.owns).toContain("FinanceJournal");
    expect(BOUNDED_CONTEXTS.atlasFinance.owns).toContain("FinanceAccount");
  });

  it("never owns Invoice/Payment/Wallet masters", () => {
    expect(ownerOf("Invoice")).toBe("payments");
    expect(ownerOf("Payment")).toBe("payments");
    expect(ownerOf("Wallet")).toBe("wallet");
    expect(ownerOf("FinanceJournal")).toBe("atlasFinance");
    expect(ownerOf("FinanceExpense")).toBe("atlasFinance");
    expect(FINANCE_CONSUMES).toContain("Invoice");
    expect(FINANCE_CONSUMES).toContain("Payment");
  });

  it("declares Finance module as financial_operating_system", () => {
    expect(ATLAS_FINANCE_MODULE.role).toBe("financial_operating_system");
    expect(ATLAS_FINANCE_MODULE.internalModulePath).toBe(
      "modules/atlas-finance",
    );
    expect(ATLAS_FINANCE_MODULE.consumes).toContain("Invoice");
  });

  it("maps finance nav to atlasFinance", () => {
    const m = ATLAS_ROOT_MODULES.find((x) => x.id === "finance");
    expect(m?.boundedContext).toBe("atlasFinance");
    expect(m?.status).toBe("foundation");
  });
});

describe("ATLAS Finance double-entry engine", () => {
  it("rejects unbalanced journals", () => {
    const bad = balanceJournalLines([
      { accountId: "a", debit: 100 },
      { accountId: "b", credit: 50 },
    ]);
    expect(bad.ok).toBe(false);

    const good = balanceJournalLines([
      { accountId: "a", debit: 100 },
      { accountId: "b", credit: 100 },
    ]);
    expect(good.ok).toBe(true);
    expect(good.totalDebit).toBe(100);
  });

  it("builds statements and health score", () => {
    const trial = buildTrialBalance([
      {
        accountId: "1",
        code: "1000",
        name: "Cash",
        accountType: "asset",
        debitTotal: 100,
        creditTotal: 0,
      },
      {
        accountId: "2",
        code: "4000",
        name: "Sales",
        accountType: "revenue",
        debitTotal: 0,
        creditTotal: 100,
      },
    ]);
    expect(trial.balanced).toBe(true);

    const pnl = buildIncomeStatement({
      revenueTotal: 1000,
      cogsTotal: 400,
      expenseTotal: 200,
    });
    expect(pnl.netIncome).toBe(400);

    const bs = buildBalanceSheet({
      assets: 1400,
      liabilities: 0,
      equity: 1000,
      netIncome: 400,
    });
    expect(bs.balanced).toBe(true);

    expect(calculateTaxAmount(100, 0.15)).toBe(15);
    expect(
      businessHealthScore({
        netIncome: 400,
        revenue: 1000,
        cashBalance: 500,
        expenseTotal: 200,
      }),
    ).toBeGreaterThan(50);
  });

  it("seeds a standard COA", () => {
    expect(STANDARD_COA.some((a) => a.code === "1000")).toBe(true);
    expect(STANDARD_COA.some((a) => a.code === "4000")).toBe(true);
  });

  it("lists finance AI actions", () => {
    expect(FINANCE_AI_ACTIONS).toContain("forecast_revenue");
    expect(FINANCE_AI_ACTIONS).toContain("detect_fraud");
    const stub = createFinanceAiStub({
      action: "business_health",
      workspaceId: "w1",
    });
    expect(stub.status).toBe("stub");
  });
});

describe("ATLAS Finance validators", () => {
  it("validates workspace and journal inputs", () => {
    expect(() =>
      ensureFinanceWorkspaceSchema.parse({
        businessId: "00000000-0000-4000-8000-000000000001",
      }),
    ).not.toThrow();

    expect(() =>
      postJournalSchema.parse({
        workspaceId: "00000000-0000-4000-8000-000000000001",
        lines: [
          {
            accountId: "00000000-0000-4000-8000-000000000002",
            debit: 10,
          },
          {
            accountId: "00000000-0000-4000-8000-000000000003",
            credit: 10,
          },
        ],
      }),
    ).not.toThrow();

    expect(() =>
      createExpenseSchema.parse({
        workspaceId: "00000000-0000-4000-8000-000000000001",
        amount: 50,
        category: "marketing",
        createdBy: "00000000-0000-4000-8000-000000000004",
      }),
    ).not.toThrow();
  });
});

describe("ATLAS Finance events & permissions", () => {
  it("catalogs finance domain events", () => {
    expect(DOMAIN_EVENTS).toContain("finance.workspace_created");
    expect(DOMAIN_EVENTS).toContain("finance.expense_created");
    expect(DOMAIN_EVENTS).toContain("finance.budget_exceeded");
    expect(DOMAIN_EVENTS).toContain("finance.transaction_completed");
    expect(DOMAIN_EVENTS).toContain("finance.refund_processed");
    expect(DOMAIN_EVENTS).toContain("finance.tax_calculated");
  });

  it("registers payment and business handlers", () => {
    expect(FINANCE_EVENT_HANDLERS["business.created"].action).toBe("provision");
    expect(FINANCE_EVENT_HANDLERS["payment.confirmed"].action).toBe("post");
    expect(FINANCE_EVENT_HANDLERS["invoice.paid"]).toBeDefined();
  });

  it("grants merchant finance permissions", () => {
    const perms = permissionsForPlatformRole("merchant");
    expect(hasPermission(perms, "finance:journal:post")).toBe(true);
    expect(hasPermission(perms, "finance:expense:create")).toBe(true);
    expect(hasPermission(permissionsForPlatformRole("customer"), "finance:journal:post")).toBe(
      false,
    );
  });
});
