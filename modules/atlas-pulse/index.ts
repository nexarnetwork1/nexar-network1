/**
 * ATLAS Pulse — Business Intelligence Feed module.
 * Real-time activity engine; not social media.
 */

export * from "./types";
export * from "./validators";
export * from "./ranking";
export * from "./recommendations";
export * from "./repository";
export * from "./service";
export { registerAtlasPulseEventHandlers } from "./events";

export {
  ensureBusinessPulse,
  ingestPulseEvent,
  ingestFromDomainEvent,
  getBusinessPulseFeed,
  getDiscoveryFeed,
  generateRecommendations,
  createAtlasPulsePort,
} from "./service";
