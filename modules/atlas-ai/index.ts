/**
 * ATLAS AI — Business Intelligence Engine module.
 */

export type {
  AiWorkspace,
  AiAgent,
  AiConversation,
  AiMessage,
  AiMemory,
  AiKnowledgeItem,
  AiCapability,
  AiAgentRole,
  AiInsightKind,
  AiMonetizationFeature,
  EnsureAiWorkspaceInput,
  CreateAiConversationInput,
  RunCapabilityInput,
  IndexKnowledgeInput,
} from "./types";

export {
  DEFAULT_AI_AGENTS,
  AI_EVENT_HANDLERS,
  BUSINESS_CONTEXT_MODULES,
  ORDER_CREATED_WORKFLOW_STEPS,
} from "./types";

export {
  ensureBusinessAi,
  getBusinessAiWorkspace,
  listAgents,
  startConversation,
  sendAiMessage,
  runCapability,
  indexKnowledge,
  semanticSearch,
  remember,
  recallMemories,
  generateInsight,
  generatePrediction,
  generateReport,
  createRecommendation,
  executeWorkflow,
  handleAiDomainEvent,
  createAtlasAiPort,
  getWorkspaceContext,
  listConversations,
  listMessages,
  selectAgentForCapability,
  AGENT_CAPABILITY_ROUTING,
  agentForRole,
  stubEmbed,
  cosineSimilarity,
  rankBySimilarity,
  ORDER_CREATED_PIPELINE,
  planWorkflowExecution,
  describeAutomationPacks,
  scoreMemoryRelevance,
  mergeMemoryCandidates,
} from "./service";

export { registerAtlasAiEventHandlers } from "./events";

export {
  ensureWorkspaceSchema,
  createConversationSchema,
  runCapabilitySchema,
  indexKnowledgeSchema,
  semanticSearchSchema,
  executeWorkflowSchema,
} from "./validators";
