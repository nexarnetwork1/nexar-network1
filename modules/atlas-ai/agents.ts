/**
 * ATLAS AI — agent system (pure).
 * Routes capabilities to role-specialized agents.
 */

import type { AiAgentRole, AiCapability, AiToolKind } from "./types";
import { DEFAULT_AI_AGENTS } from "./types";

export const AGENT_CAPABILITY_ROUTING: Partial<
  Record<AiCapability, AiAgentRole[]>
> = {
  generate_content: ["marketing", "sales", "legal", "hr", "developer"],
  summarize: ["support", "ceo", "analytics"],
  translate: ["support"],
  analyze: ["analytics", "ceo", "finance"],
  predict: ["analytics", "inventory", "finance"],
  forecast: ["finance", "analytics", "inventory"],
  recommend: ["ceo", "sales", "analytics"],
  search: ["developer", "analytics"],
  classify: ["support", "sales", "hr"],
  extract: ["legal", "finance", "developer"],
  automate: ["operations", "developer"],
  optimize: ["operations", "ceo", "inventory"],
};

export function agentForRole(role: AiAgentRole) {
  return DEFAULT_AI_AGENTS.find((a) => a.role === role) ?? null;
}

export function defaultCapabilitiesForRole(role: AiAgentRole): AiCapability[] {
  return agentForRole(role)?.capabilities ?? [];
}

export function defaultToolsForRole(role: AiAgentRole): AiToolKind[] {
  return agentForRole(role)?.tools ?? [];
}

/** Prefer first matching agent role for a capability. */
export function selectAgentForCapability(capability: AiCapability): AiAgentRole {
  const preferred = AGENT_CAPABILITY_ROUTING[capability];
  return preferred?.[0] ?? "ceo";
}

export function agentsSupportingCapability(
  capability: AiCapability,
): AiAgentRole[] {
  return AGENT_CAPABILITY_ROUTING[capability] ?? ["ceo"];
}

/** Whether an agent role may invoke a tool kind. */
export function agentCanUseTool(role: AiAgentRole, tool: AiToolKind): boolean {
  return defaultToolsForRole(role).includes(tool);
}
