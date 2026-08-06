/**
 * ATLAS Core — One Platform / One Brain.
 * Orchestration, outbox, timeline, search, notification hub, analytics bridge.
 */

export {
  CORE_WORKFLOWS,
  CORE_CONNECTED_MODULES,
  NOTIFICATION_HUB_EVENTS,
  SEARCH_INDEX_EVENTS,
  workflowForEvent,
} from "./types";

export type {
  CoreWorkflowDefinition,
  CoreWorkflowStep,
  CoreTimelineScope,
} from "./types";

export {
  planWorkflow,
  markStepsCompleted,
  listOrchestratedTriggers,
  connectedModuleCount,
} from "./workflows";

export {
  resolveChannels,
  buildHubResult,
} from "./notification-hub";

export {
  buildSearchDocumentFromEvent,
  matchSearchQuery,
} from "./search-index";

export {
  writeOutboxFromEvent,
  appendTimelineFromEvent,
  recordAnalyticsFromEvent,
  indexSearchFromEvent,
  dispatchNotificationHub,
  fanOutNotificationFromEvent,
  runCoreOrchestration,
  handleCoreDomainEvent,
  unifiedSearch,
  createAtlasCorePort,
  createNotificationsPortAdapter,
} from "./service";

export { registerAtlasCoreEventHandlers } from "./events";
