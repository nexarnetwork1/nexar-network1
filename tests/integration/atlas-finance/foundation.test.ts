/**
 * ATLAS Finance foundation — domain wiring smoke (no DB).
 */
import { describe, expect, it } from "vitest";
import {
  ACTIVE_CONTEXTS,
  ATLAS_MODULE_CONTEXTS,
  ATLAS_FINANCE_MODULE,
} from "@/domains";
import type { AtlasFinancePort } from "@/domains/contracts/ports";
import { balanceJournalLines } from "@/modules/atlas-finance/ledger";

describe("ATLAS Finance integration foundation", () => {
  it("includes atlasFinance in ACTIVE_CONTEXTS", () => {
    expect(ACTIVE_CONTEXTS).toContain("atlasFinance");
  });

  it("maps ATLAS finance module to atlasFinance context", () => {
    expect(ATLAS_MODULE_CONTEXTS.finance).toBe("atlasFinance");
    expect(ATLAS_FINANCE_MODULE.dbNamespace).toBe("atlas_finance");
    expect(ATLAS_FINANCE_MODULE.role).toBe("financial_operating_system");
  });

  it("defines AtlasFinancePort contract shape", () => {
    const required: Array<keyof AtlasFinancePort> = [
      "ensureWorkspace",
      "getWorkspace",
      "postJournal",
      "createExpense",
      "createBudget",
      "calculateTax",
      "generateReports",
    ];
    expect(required).toHaveLength(7);
  });

  it("keeps double-entry engine importable without server-only", () => {
    const result = balanceJournalLines([
      { accountId: "1", debit: 5 },
      { accountId: "2", credit: 5 },
    ]);
    expect(result.ok).toBe(true);
  });
});
