/**
 * ATLAS AI — workflow engine (pure).
 * Declarative steps; execution persistence lives in repository/service.
 */

import { ORDER_CREATED_WORKFLOW_STEPS } from "./types";
import type { AiMonetizationFeature } from "./types";

export type WorkflowStep = {
  step: number;
  action: string;
  params?: Record<string, unknown>;
};

export type PlannedWorkflowAction = {
  step: number;
  action: string;
  status: "planned";
  params: Record<string, unknown>;
};

export const ORDER_CREATED_PIPELINE: WorkflowStep[] =
  ORDER_CREATED_WORKFLOW_STEPS.map((s) => ({
    step: s.step,
    action: s.action,
  }));

export function planWorkflowExecution(
  steps: WorkflowStep[],
  context: Record<string, unknown> = {},
): PlannedWorkflowAction[] {
  return steps.map((s) => ({
    step: s.step,
    action: s.action,
    status: "planned" as const,
    params: { ...context, ...(s.params ?? {}) },
  }));
}

export function describeAutomationPacks(): Array<{
  feature: AiMonetizationFeature;
  name: string;
  description: string;
}> {
  return [
    {
      feature: "ai_credits",
      name: "AI Credits",
      description: "Pay-per-capability usage across agents and workflows",
    },
    {
      feature: "premium_ai",
      name: "Premium AI",
      description: "Higher limits, priority routing, advanced insights",
    },
    {
      feature: "enterprise_ai",
      name: "Enterprise AI",
      description: "SSO-ready workspaces, audit, dedicated throughput",
    },
    {
      feature: "private_models",
      name: "Private Models",
      description: "Bring-your-own / private model endpoints",
    },
    {
      feature: "business_agents",
      name: "Business Agents",
      description: "Full system agent roster per workspace",
    },
    {
      feature: "custom_agents",
      name: "Custom Agents",
      description: "User-defined agents with custom tools and prompts",
    },
    {
      feature: "automation_packs",
      name: "Automation Packs",
      description: "Prebuilt workflow packs (orders, finance, HR, marketing)",
    },
  ];
}

/** Map ecosystem event → default workflow slug. */
export function workflowSlugForEvent(eventName: string): string | null {
  if (eventName === "order.placed" || eventName === "order.paid") {
    return "order-created";
  }
  return null;
}
