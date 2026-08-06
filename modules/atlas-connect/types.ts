/**
 * ATLAS Connect — domain types.
 * Business Collaboration Platform — not a chat app.
 */

export type ConnectChannelType =
  | "general"
  | "sales"
  | "support"
  | "finance"
  | "hr"
  | "marketing"
  | "operations"
  | "development"
  | "management"
  | "announcements"
  | "marketplace"
  | "projects"
  | "private"
  | "public";

export type ConnectConversationKind =
  | "direct"
  | "group"
  | "channel"
  | "business"
  | "customer"
  | "supplier"
  | "partner"
  | "department"
  | "project"
  | "support";

export type ConnectMessageType =
  | "text"
  | "image"
  | "video"
  | "voice"
  | "pdf"
  | "document"
  | "spreadsheet"
  | "presentation"
  | "product"
  | "service"
  | "marketplace_listing"
  | "quotation"
  | "invoice"
  | "purchase_order"
  | "payment_link"
  | "wallet_transfer"
  | "task"
  | "calendar_event"
  | "location"
  | "ai_response"
  | "announcement"
  | "system";

export type ConnectParticipantRole =
  | "owner"
  | "admin"
  | "manager"
  | "department_manager"
  | "finance"
  | "sales"
  | "hr"
  | "support"
  | "employee"
  | "guest";

export type ConnectMeetingStatus =
  | "scheduled"
  | "in_progress"
  | "ended"
  | "cancelled";

export type ConnectCallType = "voice" | "video";

export type ConnectCallStatus =
  | "ringing"
  | "active"
  | "ended"
  | "missed"
  | "declined";

export type ConnectTaskStatus =
  | "open"
  | "in_progress"
  | "completed"
  | "cancelled";

export type ConnectApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

export type ConnectReferenceType =
  | "quotation"
  | "invoice"
  | "order"
  | "payment"
  | "product"
  | "service"
  | "store";

export type ConnectActionType =
  | "task"
  | "lead"
  | "customer"
  | "supplier"
  | "employee"
  | "order"
  | "invoice"
  | "calendar_event"
  | "crm_opportunity"
  | "business_note";

export type ConnectFileCategory =
  | "contract"
  | "invoice"
  | "certificate"
  | "drawing"
  | "company_document"
  | "product_catalog"
  | "media"
  | "business_card"
  | "general";

export type ConnectReactionType =
  | "like"
  | "celebrate"
  | "support"
  | "insightful"
  | "interesting"
  | "love"
  | "approve";

export type ConnectWorkspace = {
  id: string;
  business_id: string;
  owner_user_id: string;
  name: string;
  slug: string;
  metadata: Record<string, unknown>;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ConnectChannel = {
  id: string;
  workspace_id: string;
  channel_type: ConnectChannelType;
  name: string;
  slug: string;
  description: string | null;
  is_private: boolean;
  is_archived: boolean;
  created_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ConnectConversation = {
  id: string;
  workspace_id: string;
  channel_id: string | null;
  conversation_kind: ConnectConversationKind;
  title: string | null;
  external_business_id: string | null;
  external_user_id: string | null;
  project_id: string | null;
  department_id: string | null;
  last_message_at: string | null;
  message_count: number;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export type ConnectMessage = {
  id: string;
  conversation_id: string;
  sender_user_id: string | null;
  message_type: ConnectMessageType;
  body: string | null;
  payload: Record<string, unknown>;
  thread_id: string | null;
  reply_to_id: string | null;
  is_edited: boolean;
  is_pinned: boolean;
  is_ai_generated: boolean;
  is_encrypted: boolean;
  encryption_key_id: string | null;
  sent_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
};

export type ConnectWorkspaceMember = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: ConnectParticipantRole;
  department_id: string | null;
  joined_at: string;
  left_at: string | null;
  metadata: Record<string, unknown>;
};

export type ConnectDepartment = {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  manager_user_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ConnectTeam = {
  id: string;
  workspace_id: string;
  department_id: string | null;
  name: string;
  slug: string;
  lead_user_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ConnectThread = {
  id: string;
  conversation_id: string;
  root_message_id: string;
  reply_count: number;
  last_reply_at: string | null;
  created_at: string;
};

export type ConnectMessageReaction = {
  id: string;
  message_id: string;
  user_id: string;
  reaction_type: ConnectReactionType;
  created_at: string;
};

export type ConnectAttachment = {
  id: string;
  message_id: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  storage_path: string;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  is_encrypted: boolean;
  encryption_key_id: string | null;
  malware_scan_status: string;
  malware_scanned_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ConnectPinnedMessage = {
  id: string;
  conversation_id: string;
  message_id: string;
  pinned_by: string;
  pinned_at: string;
};

export type ConnectAnnouncement = {
  id: string;
  workspace_id: string;
  channel_id: string | null;
  author_user_id: string;
  title: string;
  body: string | null;
  payload: Record<string, unknown>;
  published_at: string;
  expires_at: string | null;
  created_at: string;
};

export type ConnectCall = {
  id: string;
  workspace_id: string;
  conversation_id: string | null;
  call_type: ConnectCallType;
  status: ConnectCallStatus;
  initiator_user_id: string;
  started_at: string | null;
  ended_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ConnectApproval = {
  id: string;
  workspace_id: string;
  conversation_id: string | null;
  source_message_id: string | null;
  title: string;
  status: ConnectApprovalStatus;
  requested_by: string;
  approver_user_id: string | null;
  decided_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ConnectCalendarEvent = {
  id: string;
  workspace_id: string;
  conversation_id: string | null;
  source_message_id: string | null;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  organizer_user_id: string;
  location: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ConnectSharedFile = {
  id: string;
  workspace_id: string;
  conversation_id: string | null;
  uploaded_by: string;
  file_category: ConnectFileCategory;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  storage_path: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ConnectMessageAction = {
  id: string;
  message_id: string;
  action_type: ConnectActionType;
  result_entity_type: string | null;
  result_entity_id: string | null;
  created_by: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ConnectAuditLog = {
  id: string;
  workspace_id: string | null;
  actor_user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ConnectNotificationPrefs = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  realtime_enabled: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  desktop_enabled: boolean;
  mention_enabled: boolean;
  priority_alerts_enabled: boolean;
  metadata: Record<string, unknown>;
  updated_at: string;
};

export type ConnectDeviceSession = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  device_label: string | null;
  device_fingerprint: string | null;
  ip_address: string | null;
  user_agent: string | null;
  last_seen_at: string;
  revoked_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

/** Monetization plan hooks — foundation only. */
export type ConnectMonetizationFeature =
  | "enterprise_collaboration"
  | "premium_workspaces"
  | "advanced_ai"
  | "large_file_storage"
  | "business_channels"
  | "video_meetings"
  | "ai_credits";

export type ConnectParticipant = {
  id: string;
  conversation_id: string;
  user_id: string;
  role: ConnectParticipantRole;
  last_read_at: string | null;
  is_muted: boolean;
  joined_at: string;
  left_at: string | null;
  metadata: Record<string, unknown>;
};

export type ConnectTask = {
  id: string;
  workspace_id: string;
  conversation_id: string | null;
  source_message_id: string | null;
  title: string;
  description: string | null;
  status: ConnectTaskStatus;
  assignee_user_id: string | null;
  created_by: string;
  due_at: string | null;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ConnectMeeting = {
  id: string;
  workspace_id: string;
  conversation_id: string | null;
  title: string;
  status: ConnectMeetingStatus;
  host_user_id: string;
  scheduled_start: string;
  scheduled_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  recording_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ConnectEntityReference = {
  id: string;
  message_id: string;
  reference_type: ConnectReferenceType;
  entity_id: string;
  entity_label: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

export type SendMessageInput = {
  conversationId: string;
  /** Null for system / AI automation messages. */
  senderUserId: string | null;
  messageType: ConnectMessageType;
  body?: string;
  payload?: Record<string, unknown>;
  replyToId?: string;
  references?: Array<{
    referenceType: ConnectReferenceType;
    entityId: string;
    entityLabel?: string;
    payload?: Record<string, unknown>;
  }>;
};

export type CreateConversationInput = {
  workspaceId: string;
  conversationKind: ConnectConversationKind;
  title?: string;
  channelId?: string;
  participantUserIds: string[];
  createdBy: string;
  externalBusinessId?: string;
  externalUserId?: string;
  departmentId?: string;
};

/** Default channels provisioned for every workspace. */
export const DEFAULT_CONNECT_CHANNELS: ReadonlyArray<{
  channelType: ConnectChannelType;
  name: string;
  slug: string;
}> = [
  { channelType: "general", name: "General", slug: "general" },
  { channelType: "announcements", name: "Announcements", slug: "announcements" },
  { channelType: "sales", name: "Sales", slug: "sales" },
  { channelType: "support", name: "Support", slug: "support" },
  { channelType: "finance", name: "Finance", slug: "finance" },
  { channelType: "hr", name: "HR", slug: "hr" },
  { channelType: "marketplace", name: "Marketplace", slug: "marketplace" },
];

/** Maps domain events → Connect side-effects (not message creation). */
export const CONNECT_EVENT_HANDLERS: Record<
  string,
  { action: "notify" | "audit" | "provision"; description: string }
> = {
  "business.created": { action: "provision", description: "Ensure workspace" },
  "order.paid": { action: "notify", description: "Marketplace sale notification" },
  "invoice.issued": { action: "notify", description: "Invoice shared in finance channel" },
  "payment.confirmed": { action: "notify", description: "Payment completed notification" },
  "employee.hired": { action: "notify", description: "New team member announcement" },
  "partner.accepted": { action: "notify", description: "Partnership notification" },
};
