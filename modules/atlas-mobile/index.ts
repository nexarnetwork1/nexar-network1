/**
 * ATLAS Mobile — Mobile Business Platform.
 * Complete mobile experience of ATLAS — offline-first, cloud-synced.
 */

export type {
  MobileDevice,
  MobileOfflineQueueItem,
  MobileSyncCursor,
  MobilePushDelivery,
  MobilePlatform,
  MobilePushCategory,
  MobileSyncScope,
  MobileConflictStrategy,
  MobileCameraJobType,
  RegisterDeviceInput,
  EnqueueOfflineMutationInput,
  QueuePushInput,
} from "./types";

export {
  MOBILE_APPLICATIONS,
  MOBILE_DASHBOARD_WIDGETS,
  MOBILE_CONSUMES,
  MOBILE_EVENT_HANDLERS,
} from "./types";

export {
  resolveConflict,
  prioritizeOfflineBatch,
  isOfflineCapableScope,
} from "./offline";

export { buildSyncPlan, advanceCursor, mergeCursors } from "./sync";

export {
  buildPushPayload,
  pushCategoryForEvent,
  PUSH_CATEGORY_DEFAULTS,
} from "./push";

export { parseDeepLink, buildUniversalLink } from "./deep-links";

export { createCameraJobStub, CAMERA_JOB_TYPES } from "./camera";

export {
  registerMobileDevice,
  registerPushToken,
  queueMobilePush,
  enqueueMobileOfflineMutation,
  processOfflineSyncBatch,
  pullMobileSync,
  remoteLogoutDevice,
  startCameraScan,
  resolveMobileDeepLink,
  handleMobileDomainEvent,
  createAtlasMobilePort,
} from "./service";

export { registerAtlasMobileEventHandlers } from "./events";

export {
  registerDeviceSchema,
  enqueueOfflineSchema,
  queuePushSchema,
  syncPullSchema,
} from "./validators";
