/**
 * ATLAS Core — workflow planning (pure).
 * Peer modules execute their own handlers; core records the orchestration plan.
 */

import {
  CORE_WORKFLOWS,
  workflowForEvent,
  type CoreWorkflowDefinition,
  type CoreWorkflowStep,
} from "./types";

export function planWorkflow(
  eventName: string,
): { workflow: CoreWorkflowDefinition; steps: CoreWorkflowStep[] } | null {
  const workflow = workflowForEvent(eventName);
  if (!workflow) return null;
  return {
    workflow,
    steps: workflow.steps.map((s) => ({
      module: s.module,
      action: s.action,
      status: "planned" as const,
    })),
  };
}

export function markStepsCompleted(
  steps: CoreWorkflowStep[],
): CoreWorkflowStep[] {
  return steps.map((s) => ({ ...s, status: "completed" as const }));
}

export function listOrchestratedTriggers(): string[] {
  return CORE_WORKFLOWS.map((w) => w.trigger);
}

export function connectedModuleCount(): number {
  return new Set(CORE_WORKFLOWS.flatMap((w) => w.steps.map((s) => s.module)))
    .size;
}
