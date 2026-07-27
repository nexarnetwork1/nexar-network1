import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MerchantProfile, MerchantVerificationLevel } from "@/types";

export type VerificationStatus = MerchantProfile["verification_status"];

export async function getMerchantVerification(profileId: string): Promise<MerchantProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("merchant_profiles")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();
  return (data as MerchantProfile) ?? null;
}

export async function getPendingVerifications(): Promise<MerchantProfile[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("merchant_profiles")
    .select("*")
    .in("verification_status", ["pending", "under_review"])
    .order("created_at", { ascending: true });
  return (data ?? []) as MerchantProfile[];
}

export async function updateVerificationStatus(params: {
  profileId: string;
  status: VerificationStatus;
  level?: MerchantVerificationLevel;
  kycProvider?: string;
  kycReference?: string;
  blacklistReason?: string;
}): Promise<boolean> {
  const admin = createAdminClient();
  const updates: Record<string, unknown> = {
    verification_status: params.status,
    updated_at: new Date().toISOString(),
  };

  if (params.level) updates.verification_level = params.level;
  if (params.kycProvider) updates.kyc_provider = params.kycProvider;
  if (params.kycReference) updates.kyc_reference = params.kycReference;

  if (params.status === "verified") {
    updates.verified_at = new Date().toISOString();
  }
  if (params.status === "blacklisted") {
    updates.blacklisted_at = new Date().toISOString();
    updates.blacklist_reason = params.blacklistReason ?? null;
  }

  const { error } = await admin
    .from("merchant_profiles")
    .update(updates)
    .eq("profile_id", params.profileId);

  return !error;
}
