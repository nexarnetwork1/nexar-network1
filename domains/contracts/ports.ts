/**
 * Cross-module contracts (ports).
 * Modules depend on these interfaces — never on each other's repositories.
 */

import type { BusinessId, UserId, StoreId, ProductId, OrderId } from "../kernel/ids";
import type { BusinessMemberRole } from "../kernel/roles";

/** Business Hub — canonical company aggregate (ATLAS Business capability). */
export type BusinessRecord = {
  id: BusinessId;
  ownerUserId: UserId;
  legalName: string;
  displayName: string;
  verificationStatus: "unverified" | "pending" | "verified" | "rejected";
  primaryStoreId: StoreId | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export interface BusinessHubPort {
  getById(id: BusinessId): Promise<BusinessRecord | null>;
  getByOwner(userId: UserId): Promise<BusinessRecord[]>;
  assertMember(
    businessId: BusinessId,
    userId: UserId,
    roles?: BusinessMemberRole[],
  ): Promise<boolean>;
}

/** Catalog — product queries scoped by Business Hub tenancy. */
export interface CatalogPort {
  getProduct(
    id: ProductId,
  ): Promise<{ id: ProductId; businessId: BusinessId; title: string } | null>;
}

/** Orders — commerce transactions. */
export interface OrdersPort {
  getOrder(id: OrderId): Promise<{ id: OrderId; businessId: BusinessId; customerId: UserId } | null>;
}

/** Payments — money movement. */
export interface PaymentsPort {
  isOrderPaid(orderId: OrderId): Promise<boolean>;
}

/** Wallet — balances & ledger. */
export interface WalletPort {
  getPrimaryWallet(ownerId: UserId | BusinessId): Promise<{ id: string; balance: string } | null>;
}

/** Notifications — fan-out from events. */
export interface NotificationsPort {
  notifyUser(userId: UserId, title: string, body: string): Promise<void>;
}

/** Auth — identity resolution for other modules. */
export interface IdentityPort {
  requireUserId(): Promise<UserId>;
}

/** ATLAS Network — Business Social Network profiles & graph. */
export type NetworkProfileRecord = {
  id: string;
  slug: string;
  displayName: string;
  profileKind: string;
  businessId: string | null;
  ownerUserId: string;
  verified: boolean;
};

export interface AtlasNetworkPort {
  getProfileById(id: string): Promise<NetworkProfileRecord | null>;
  getProfileByBusinessId(businessId: BusinessId): Promise<NetworkProfileRecord | null>;
  ensureCompanyProfile(input: {
    businessId: string;
    ownerUserId: string;
    displayName: string;
    legalName: string;
    slug: string;
    businessType?: string | null;
    logoUrl?: string | null;
    website?: string | null;
  }): Promise<NetworkProfileRecord>;
}

/** ATLAS Pulse — Business Intelligence Feed. */
export type PulseFeedItemRecord = {
  id: string;
  feedId: string;
  businessId: string | null;
  itemType: string;
  source: string;
  title: string;
  summary: string | null;
  trendingScore: number;
  publishedAt: Date;
};

export type PulseTimelineRecord = {
  businessId: string;
  feedId: string;
  itemCount: number;
  lastActivityAt: Date | null;
};

export interface AtlasPulsePort {
  getBusinessFeed(businessId: BusinessId, limit?: number): Promise<PulseFeedItemRecord[]>;
  getDiscoveryFeed(limit?: number): Promise<PulseFeedItemRecord[]>;
  getTimeline(businessId: BusinessId): Promise<PulseTimelineRecord | null>;
  ingestEvent(event: {
    name: string;
    actorId: string | null;
    businessId: string | null;
    payload: Record<string, unknown>;
  }): Promise<PulseFeedItemRecord | null>;
}

/** ATLAS Connect — Business Collaboration Platform. */
export type ConnectWorkspaceRecord = {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  isPremium: boolean;
};

export type ConnectConversationRecord = {
  id: string;
  workspaceId: string;
  conversationKind: string;
  title: string | null;
  messageCount: number;
  lastMessageAt: Date | null;
};

export type ConnectMessageRecord = {
  id: string;
  conversationId: string;
  senderUserId: string | null;
  messageType: string;
  body: string | null;
  sentAt: Date;
  isAiGenerated: boolean;
};

export type ConnectSuggestedAction = {
  actionType: string;
  label: string;
  confidence: number;
  reason: string;
};

export type ConnectChannelRecord = {
  id: string;
  workspaceId: string;
  channelType: string;
  name: string;
  slug: string;
};

export type ConnectSearchHitRecord = {
  scope: string;
  entityId: string;
  title: string;
  snippet: string | null;
  score: number;
  workspaceId: string;
  conversationId?: string;
};

export interface AtlasConnectPort {
  getWorkspace(businessId: BusinessId): Promise<ConnectWorkspaceRecord | null>;
  listConversations(
    workspaceId: string,
    limit?: number,
  ): Promise<ConnectConversationRecord[]>;
  getMessages(
    conversationId: string,
    limit?: number,
  ): Promise<ConnectMessageRecord[]>;
  sendMessage(input: {
    conversationId: string;
    senderUserId: string;
    messageType: string;
    body?: string;
    payload?: Record<string, unknown>;
    replyToId?: string;
  }): Promise<ConnectMessageRecord>;
  createConversation(input: {
    workspaceId: string;
    conversationKind: string;
    title?: string;
    channelId?: string;
    participantUserIds: string[];
    createdBy: string;
  }): Promise<ConnectConversationRecord>;
  suggestActions(message: {
    messageType: string;
    body: string | null;
    payload: Record<string, unknown>;
  }): Promise<ConnectSuggestedAction[]>;
  getPrimaryAction(messageType: string): Promise<string | null>;
  ensureWorkspace(input: {
    businessId: string;
    ownerUserId: string;
    displayName: string;
    slug: string;
  }): Promise<ConnectWorkspaceRecord>;
  listChannels(workspaceId: string): Promise<ConnectChannelRecord[]>;
  scheduleMeeting(input: {
    workspaceId: string;
    conversationId?: string;
    title: string;
    hostUserId: string;
    scheduledStart: string;
    scheduledEnd?: string;
    businessId?: string;
  }): Promise<{ meetingId: string }>;
  convertToTask(input: {
    messageId: string;
    workspaceId: string;
    conversationId?: string;
    title: string;
    description?: string;
    assigneeUserId?: string;
    createdBy: string;
  }): Promise<{ taskId: string }>;
  search(input: {
    workspaceId: string;
    query: string;
    scopes?: string[];
    limit?: number;
  }): Promise<ConnectSearchHitRecord[]>;
}

/** ATLAS AI — Business Intelligence Engine. */
export type AiWorkspaceRecord = {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  monetizationPlan: string;
  creditsBalance: number;
};

export type AiAgentRecord = {
  id: string;
  workspaceId: string;
  role: string;
  name: string;
  slug: string;
  capabilities: string[];
};

export type AiConversationRecord = {
  id: string;
  workspaceId: string;
  agentId: string | null;
  userId: string;
  title: string | null;
  messageCount: number;
};

export type AiInsightRecord = {
  id: string;
  workspaceId: string;
  kind: string;
  title: string;
  summary: string | null;
  score: number | null;
};

export interface AtlasAiPort {
  getWorkspace(businessId: BusinessId): Promise<AiWorkspaceRecord | null>;
  ensureWorkspace(input: {
    businessId: string;
    ownerUserId: string;
    displayName: string;
    slug: string;
  }): Promise<AiWorkspaceRecord>;
  listAgents(workspaceId: string): Promise<AiAgentRecord[]>;
  startConversation(input: {
    workspaceId: string;
    userId: string;
    agentId?: string;
    title?: string;
  }): Promise<AiConversationRecord>;
  runCapability(input: {
    workspaceId: string;
    capability: string;
    userId: string;
    prompt: string;
    agentSlug?: string;
    context?: Record<string, unknown>;
  }): Promise<{
    taskId: string;
    executionId: string;
    output: string;
    stubOutput: string;
    mode?: "openai" | "demo";
  }>;
  semanticSearch(input: {
    workspaceId: string;
    query: string;
    limit?: number;
  }): Promise<{
    lexical: Array<{ id: string; title: string; sourceType: string }>;
    vector: Array<{ id: string; content: string; score: number }>;
  }>;
  generateInsight(input: {
    workspaceId: string;
    insightKind: string;
    title: string;
    summary?: string;
    score?: number;
    payload?: Record<string, unknown>;
  }): Promise<AiInsightRecord>;
  executeWorkflow(input: {
    workspaceId: string;
    workflowSlug: string;
    context?: Record<string, unknown>;
  }): Promise<{ executionId: string }>;
}

/** ATLAS Marketplace — Commerce Engine (sales channel). */
export type MarketplaceStorefrontRecord = {
  id: string;
  businessId: string;
  storeId: string | null;
  slug: string;
  displayName: string;
  isPremium: boolean;
  isPublished: boolean;
  listingCount: number;
};

export type MarketplaceListingRecord = {
  id: string;
  storefrontId: string;
  businessId: string;
  productId: string | null;
  sellingType: string;
  status: string;
  title: string;
  slug: string;
  price: number | null;
  currency: string;
  isFeatured: boolean;
  publishedAt: Date | null;
};

export interface AtlasMarketplacePort {
  getStorefront(businessId: BusinessId): Promise<MarketplaceStorefrontRecord | null>;
  ensureStorefront(input: {
    businessId: string;
    ownerUserId: string;
    displayName: string;
    slug: string;
    storeId?: string;
  }): Promise<MarketplaceStorefrontRecord>;
  publishListing(input: {
    storefrontId: string;
    businessId: string;
    productId?: string;
    sellingType: string;
    title: string;
    slug: string;
    summary?: string;
    price?: number;
    currency?: string;
    actorUserId: string;
  }): Promise<MarketplaceListingRecord>;
  listListings(
    storefrontId: string,
    limit?: number,
  ): Promise<MarketplaceListingRecord[]>;
  search(input: {
    query: string;
    storefrontId?: string;
    businessId?: string;
    sellingType?: string;
    limit?: number;
  }): Promise<MarketplaceListingRecord[]>;
  startCheckout(input: {
    buyerUserId: string;
    storefrontId?: string;
    businessId?: string;
    cartId?: string;
    paymentMethod?: string;
    couponCode?: string;
    subtotal?: number;
    discountTotal?: number;
    total?: number;
    currency?: string;
  }): Promise<{ checkoutId: string; status: string }>;
  recommend(input: {
    storefrontId?: string;
    businessId?: string;
    recentCategoryIds?: string[];
    recentListingIds?: string[];
    limit?: number;
  }): Promise<Array<{ listingId: string; score: number; reason: string }>>;
}

/** ATLAS Apps — Business Applications Platform (plugin / store layer). */
export type AppApplicationRecord = {
  id: string;
  slug: string;
  name: string;
  status: string;
  pricingModel: string;
  isSystem: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  installCount: number;
  ratingAvg: number;
  latestVersion: string | null;
};

export type AppInstallRecord = {
  id: string;
  applicationId: string;
  businessId: string;
  status: string;
  installedVersion: string | null;
  previousVersion: string | null;
};

export interface AtlasAppsPort {
  discover(query?: {
    query?: string;
    categorySlug?: string;
    featuredOnly?: boolean;
    verifiedOnly?: boolean;
    limit?: number;
  }): Promise<AppApplicationRecord[]>;
  getBySlug(slug: string): Promise<AppApplicationRecord | null>;
  listInstalled(businessId: BusinessId): Promise<AppInstallRecord[]>;
  install(input: {
    applicationId: string;
    businessId: string;
    installedBy: string;
    version?: string;
    grantedScopes?: Array<{ scope: string; accessLevel: string }>;
  }): Promise<AppInstallRecord>;
  enable(
    applicationId: string,
    businessId: string,
    actorUserId: string,
  ): Promise<AppInstallRecord>;
  disable(
    applicationId: string,
    businessId: string,
    actorUserId: string,
  ): Promise<AppInstallRecord>;
  uninstall(
    applicationId: string,
    businessId: string,
    actorUserId: string,
  ): Promise<AppInstallRecord>;
  recommend(input: {
    businessId: string;
    industry?: string | null;
    hasProducts?: boolean;
    hasOrders?: boolean;
    employeeCount?: number;
    limit?: number;
  }): Promise<
    Array<{ applicationId: string; slug: string; score: number; reason: string }>
  >;
}

/** ATLAS Finance — Financial Operating System (GL / tax / budgets over money rails). */
export type FinanceWorkspaceRecord = {
  id: string;
  businessId: string;
  baseCurrency: string;
  fiscalYearStartMonth: number;
  isActive: boolean;
};

export type FinanceJournalRecord = {
  id: string;
  workspaceId: string;
  journalNumber: string;
  status: string;
  currency: string;
  postedAt: Date | null;
};

export type FinanceExpenseRecord = {
  id: string;
  workspaceId: string;
  number: string;
  category: string;
  amount: number;
  currency: string;
  status: string;
};

export type FinanceBudgetRecord = {
  id: string;
  workspaceId: string;
  name: string;
  amount: number;
  spent: number;
  currency: string;
  startsOn: string;
  endsOn: string;
};

export interface AtlasFinancePort {
  ensureWorkspace(input: {
    businessId: string;
    baseCurrency?: string;
    actorUserId?: string;
  }): Promise<FinanceWorkspaceRecord>;
  getWorkspace(businessId: BusinessId): Promise<FinanceWorkspaceRecord | null>;
  postJournal(input: {
    workspaceId: string;
    memo?: string;
    source?: string;
    sourceRefType?: string;
    sourceRefId?: string;
    currency?: string;
    actorUserId?: string;
    lines: Array<{
      accountId: string;
      debit?: number;
      credit?: number;
      memo?: string;
      costCenterId?: string;
      exchangeRate?: number;
    }>;
  }): Promise<FinanceJournalRecord>;
  createExpense(input: {
    workspaceId: string;
    amount: number;
    currency?: string;
    category: string;
    customCategory?: string;
    incurredOn?: string;
    vendorName?: string;
    paymentRail?: string;
    accountId?: string;
    costCenterId?: string;
    taxAmount?: number;
    notes?: string;
    createdBy: string;
    postToLedger?: boolean;
  }): Promise<FinanceExpenseRecord>;
  createBudget(input: {
    workspaceId: string;
    name: string;
    amount: number;
    currency?: string;
    periodKind?: string;
    startsOn: string;
    endsOn: string;
    costCenterId?: string;
    accountId?: string;
    alertThreshold?: number;
  }): Promise<FinanceBudgetRecord>;
  calculateTax(input: {
    workspaceId: string;
    taxRateId: string;
    taxableAmount: number;
    currency?: string;
    sourceRefType: string;
    sourceRefId?: string;
  }): Promise<{ taxAmount: number; taxableAmount: number; rate: number }>;
  generateReports(workspaceId: string): Promise<{
    trialBalance: unknown;
    incomeStatement: unknown;
    balanceSheet: unknown;
    healthScore: number;
  }>;
}

/** ATLAS Mobile — complete mobile platform layer. */
export type MobileDeviceRecord = {
  id: string;
  userId: string;
  businessId: string | null;
  platform: string;
  status: string;
  appVersion: string | null;
  lastSeenAt: Date | null;
};

export type MobileOfflineMutationRecord = {
  id: string;
  deviceId: string;
  clientMutationId: string;
  scope: string;
  status: string;
  entityType: string;
};

export type MobilePushDeliveryRecord = {
  id: string;
  userId: string;
  category: string;
  title: string;
  status: string;
  deepLink: string | null;
};

export interface AtlasMobilePort {
  registerDevice(input: {
    userId: string;
    deviceFingerprint: string;
    platform: string;
    businessId?: string;
    osVersion?: string;
    appVersion?: string;
    model?: string;
    biometricsEnabled?: boolean;
    pinEnabled?: boolean;
  }): Promise<MobileDeviceRecord>;
  queuePush(input: {
    userId: string;
    deviceId?: string;
    businessId?: string;
    category: string;
    title: string;
    body?: string;
    payload?: Record<string, unknown>;
    deepLink?: string;
  }): Promise<MobilePushDeliveryRecord>;
  enqueueOfflineMutation(input: {
    deviceId: string;
    userId: string;
    businessId?: string;
    clientMutationId: string;
    scope: string;
    entityType: string;
    entityId?: string;
    operation: "create" | "update" | "delete" | "upsert";
    payload: Record<string, unknown>;
    baseVersion?: number;
    conflictStrategy?: string;
  }): Promise<MobileOfflineMutationRecord>;
  processOfflineSync(input: {
    deviceId: string;
    userId: string;
  }): Promise<{
    accepted: string[];
    conflicts: string[];
    failed: Array<{ clientMutationId: string; error: string }>;
  }>;
  pullSync(input: {
    deviceId: string;
    userId: string;
    businessId?: string;
    scopes: string[];
  }): Promise<{ plan: unknown; cursors: Record<string, string> }>;
  remoteLogout(input: {
    deviceId: string;
    issuedBy: string;
  }): Promise<void>;
  parseDeepLink(url: string): Promise<{
    pathPattern: string;
    targetModule: string;
    params: Record<string, string>;
  } | null>;
}

/** ATLAS Core — integration spine. */
export type CoreSearchHit = {
  entityType: string;
  entityId: string;
  title: string;
  body: string | null;
  businessId: string | null;
};

export type CoreTimelineRecord = {
  id: string;
  scope: string;
  eventName: string;
  title: string;
  businessId: string | null;
  userId: string | null;
};

export interface AtlasCorePort {
  handleEvent(event: {
    id: string;
    name: string;
    occurredAt: Date;
    actorId: string | null;
    businessId: string | null;
    payload: Record<string, unknown>;
    correlationId: string;
  }): Promise<void>;
  search(query: string, limit?: number): Promise<CoreSearchHit[]>;
  notify(input: {
    userId: string;
    eventName: string;
    title: string;
    body: string;
    channels?: Array<"in_app" | "push" | "email" | "sms" | "webhook">;
    businessId?: string;
    metadata?: Record<string, unknown>;
    emailTo?: string;
    sourceEventId?: string;
  }): Promise<{ queued: string[]; skipped: string[] }>;
  indexDocument(draft: {
    entityType: string;
    entityId: string;
    businessId?: string;
    title: string;
    body?: string;
    keywords?: string[];
    isPublished?: boolean;
    rankBoost?: number;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
}

/** ATLAS NXR — Digital Economy Layer (blockchain-optional utility token). */
export type NxrAccountRecord = {
  id: string;
  kind: string;
  ownerUserId: string | null;
  businessId: string | null;
  balance: number;
  lockedBalance: number;
  isActive: boolean;
};

export type NxrTransactionRecord = {
  id: string;
  txNumber: string;
  kind: string;
  status: string;
  amount: number;
  fromAccountId: string | null;
  toAccountId: string | null;
  utility: string | null;
};

export interface AtlasNxrPort {
  ensureAccount(input: {
    kind: "personal" | "business";
    userId?: string;
    businessId?: string;
    fiatWalletId?: string;
  }): Promise<NxrAccountRecord>;
  getAccount(accountId: string): Promise<NxrAccountRecord | null>;
  transfer(input: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    memo?: string;
    actorUserId?: string;
    businessId?: string;
    utility?: string;
    referenceType?: string;
    referenceId?: string;
  }): Promise<NxrTransactionRecord>;
  pay(input: {
    payerAccountId: string;
    payeeAccountId?: string;
    amount: number;
    utility: string;
    actorUserId?: string;
    businessId?: string;
    referenceType?: string;
    referenceId?: string;
    memo?: string;
  }): Promise<NxrTransactionRecord>;
  grantReward(input: {
    toAccountId: string;
    ruleCode: string;
    baseAmount?: number;
    campaignId?: string;
    actorUserId?: string;
    businessId?: string;
    referenceType?: string;
    referenceId?: string;
  }): Promise<{ rewardId: string; amount: number; transactionId: string }>;
  fund(input: {
    accountId: string;
    amount: number;
    reason?: string;
    actorUserId?: string;
  }): Promise<NxrTransactionRecord>;
  activatePremium(input: {
    payerAccountId: string;
    feature: string;
    businessId?: string;
    actorUserId?: string;
  }): Promise<{ activationId: string; transactionId: string }>;
}

/** NEXAR HQ — sole internal administration capability of ATLAS. */
export type HqSessionRecord = {
  userId: string;
  isPlatformOwner: boolean;
  hqEnabled: boolean;
  hqVisibleInSidebar: boolean;
  nexarBusinessId: string | null;
  nexarWorkspaceId: string | null;
  staffRole: string | null;
  allowedSections: readonly string[];
  mustChangePassword: boolean;
  mustEnable2fa: boolean;
};

export interface AtlasHqPort {
  resolveSession(
    userId: string,
    role?: string | null,
  ): Promise<HqSessionRecord>;
  listTeam(): Promise<
    Array<{
      id: string;
      userId: string;
      email: string;
      platformRole: string;
      status: string;
    }>
  >;
  getActiveAnnouncements(): Promise<Record<string, unknown>[]>;
  listWebsitePages(): Promise<Record<string, unknown>[]>;
  ensureBootstrap(): Promise<{
    bootstrapped: boolean;
    alreadyComplete: boolean;
    platformOwnerUserId: string | null;
    nexarBusinessId: string | null;
  }>;
}
