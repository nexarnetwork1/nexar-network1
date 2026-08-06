import type { BusinessMemberRole } from "@/domains";

export type BusinessStatus =
  | "draft"
  | "pending"
  | "active"
  | "suspended"
  | "closed";

export type BusinessVerificationState =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected";

export type BusinessMemberStatus = "active" | "invited" | "revoked";

export type BusinessProfileData = {
  description?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  country?: string | null;
  [key: string]: unknown;
};

export type BusinessSettingsData = {
  defaultCurrency?: string;
  acceptsCrypto?: boolean;
  acceptsCard?: boolean;
  [key: string]: unknown;
};

export type Business = {
  id: string;
  owner_user_id: string;
  legal_name: string;
  display_name: string;
  slug: string;
  status: BusinessStatus;
  verification_state: BusinessVerificationState;
  business_type: string | null;
  logo_url: string | null;
  profile: BusinessProfileData;
  settings: BusinessSettingsData;
  metadata: Record<string, unknown>;
  primary_store_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type BusinessMembership = {
  id: string;
  business_id: string;
  user_id: string;
  role: BusinessMemberRole;
  status: BusinessMemberStatus;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
  revoked_at: string | null;
};

export type BusinessWithMembership = Business & {
  membership: BusinessMembership;
};
