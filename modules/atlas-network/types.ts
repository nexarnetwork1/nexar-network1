/**
 * ATLAS Network — domain types.
 * Business Social Network (not social media clone).
 */

export type NetworkProfileSubjectType =
  | "user"
  | "business"
  | "organization"
  | "page"
  | "community"
  | "event"
  | "group";

export type NetworkProfileKind =
  | "business"
  | "employee"
  | "founder"
  | "investor"
  | "partner"
  | "supplier"
  | "customer"
  | "creator"
  | "developer";

export type NetworkPrivacyLevel =
  | "public"
  | "followers"
  | "connections"
  | "private"
  | "organization_only";

export type NetworkConnectionKind =
  | "business_business"
  | "business_employee"
  | "investor_startup"
  | "supplier_merchant"
  | "partner_partner"
  | "professional";

export type NetworkConnectionStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "blocked"
  | "revoked";

export type NetworkFollowTargetType =
  | "profile"
  | "business"
  | "page"
  | "community"
  | "event";

export type NetworkPostType =
  | "text"
  | "image"
  | "video"
  | "pdf"
  | "carousel"
  | "product"
  | "service"
  | "poll"
  | "job"
  | "event"
  | "announcement"
  | "article";

export type NetworkPostVisibility =
  | "public"
  | "followers"
  | "connections"
  | "private"
  | "organization_only";

export type NetworkReactionType =
  | "like"
  | "celebrate"
  | "insightful"
  | "support"
  | "interesting"
  | "love";

export type NetworkShareType = "share" | "repost" | "quote";

export type NetworkConversationType =
  | "direct"
  | "business"
  | "team"
  | "group";

export type NetworkMessageType =
  | "text"
  | "media"
  | "file"
  | "voice"
  | "video"
  | "quote"
  | "invoice"
  | "payment";

export type NetworkActivityType =
  | "post_created"
  | "product_created"
  | "partner_added"
  | "employee_hired"
  | "store_created"
  | "event_created"
  | "job_posted"
  | "investment_made"
  | "connection_accepted"
  | "follow"
  | "share"
  | "reaction"
  | "comment";

export type NetworkCommunityRole = "owner" | "admin" | "moderator" | "member";

export type NetworkReportReason =
  | "spam"
  | "harassment"
  | "misinformation"
  | "ip_violation"
  | "other";

/** Root profile — every entity on the network has one. */
export type NetworkProfile = {
  id: string;
  subject_type: NetworkProfileSubjectType;
  subject_id: string;
  profile_kind: NetworkProfileKind;
  slug: string;
  display_name: string;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  privacy: NetworkPrivacyLevel;
  verified: boolean;
  follower_count: number;
  following_count: number;
  owner_user_id: string;
  business_id: string | null;
  profile_data: Record<string, unknown>;
  metadata: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type NetworkCompanyProfile = {
  id: string;
  business_id: string;
  network_profile_id: string;
  industry: string | null;
  location: string | null;
  website: string | null;
  showcase: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type NetworkPersonProfile = {
  id: string;
  user_id: string;
  network_profile_id: string;
  experience: unknown[];
  skills: unknown[];
  education: unknown[];
  certificates: unknown[];
  projects: unknown[];
  portfolio: Record<string, unknown>;
  current_position: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type NetworkConnection = {
  id: string;
  requester_profile_id: string;
  recipient_profile_id: string;
  connection_kind: NetworkConnectionKind;
  status: NetworkConnectionStatus;
  message: string | null;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
};

export type NetworkFollow = {
  id: string;
  follower_profile_id: string;
  target_type: NetworkFollowTargetType;
  target_id: string;
  created_at: string;
};

export type NetworkPost = {
  id: string;
  author_profile_id: string;
  business_id: string | null;
  post_type: NetworkPostType;
  title: string | null;
  body: string | null;
  visibility: NetworkPostVisibility;
  article_body_html: string | null;
  reaction_counts: Record<string, number>;
  comment_count: number;
  share_count: number;
  metadata: Record<string, unknown>;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type NetworkActivity = {
  id: string;
  activity_type: NetworkActivityType;
  actor_profile_id: string | null;
  business_id: string | null;
  target_type: string | null;
  target_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

export type NetworkPage = {
  id: string;
  network_profile_id: string;
  business_id: string | null;
  page_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CompanyProfileWithNetwork = NetworkCompanyProfile & {
  profile: NetworkProfile;
  page: NetworkPage | null;
};

export type NetworkPostMedia = {
  id: string;
  post_id: string;
  media_url: string;
  media_type: string;
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type NetworkComment = {
  id: string;
  post_id: string;
  author_profile_id: string;
  parent_id: string | null;
  body: string;
  depth: number;
  mention_ids: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type NetworkReaction = {
  id: string;
  target_type: "post" | "comment";
  target_id: string;
  profile_id: string;
  reaction_type: NetworkReactionType;
  created_at: string;
};

export type NetworkEvent = {
  id: string;
  network_profile_id: string;
  post_id: string | null;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  is_online: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type NetworkPoll = {
  id: string;
  post_id: string;
  ends_at: string | null;
  allow_multiple: boolean;
  created_at: string;
};

export type NetworkPollOption = {
  id: string;
  poll_id: string;
  label: string;
  vote_count: number;
  sort_order: number;
};

/** Enriched post shape for ATLAS feed UI. */
export type NetworkFeedPost = NetworkPost & {
  author?: Pick<
    NetworkProfile,
    "id" | "display_name" | "avatar_url" | "verified" | "subject_type" | "slug"
  > | null;
  business?: {
    id: string;
    name: string;
    logo_url: string | null;
    slug: string;
  } | null;
  media?: NetworkPostMedia[];
  poll?: NetworkPoll & { options: NetworkPollOption[] };
  event?: NetworkEvent | null;
  comments?: (NetworkComment & {
    author?: Pick<NetworkProfile, "id" | "display_name" | "avatar_url"> | null;
  })[];
  user_reacted?: boolean;
};
