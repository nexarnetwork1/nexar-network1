/**
 * ATLAS Finance — AI insight contracts (pure stubs).
 */

export type FinanceAiAction =
  | "forecast_revenue"
  | "predict_expenses"
  | "detect_fraud"
  | "predict_cash_flow"
  | "suggest_tax"
  | "financial_insights"
  | "business_health";

export const FINANCE_AI_ACTIONS: FinanceAiAction[] = [
  "forecast_revenue",
  "predict_expenses",
  "detect_fraud",
  "predict_cash_flow",
  "suggest_tax",
  "financial_insights",
  "business_health",
];

export function createFinanceAiStub(input: {
  action: FinanceAiAction;
  workspaceId: string;
  payload?: Record<string, unknown>;
}): {
  status: "stub";
  action: FinanceAiAction;
  workspaceId: string;
  result: Record<string, unknown>;
} {
  return {
    status: "stub",
    action: input.action,
    workspaceId: input.workspaceId,
    result: {
      message: `Finance AI stub: ${input.action}`,
      ...(input.payload ?? {}),
    },
  };
}
