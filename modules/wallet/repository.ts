import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CustomerProfile,
  MerchantProfile,
  Wallet,
  WalletOwnerType,
  WalletTransaction,
} from "@/types";

export async function getCustomerProfile(
  profileId: string
): Promise<CustomerProfile | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("customer_profiles")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) return null;
  return data as CustomerProfile | null;
}

export async function getMerchantProfile(
  profileId: string
): Promise<MerchantProfile | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("merchant_profiles")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) return null;
  return data as MerchantProfile | null;
}

export async function getUserWallets(
  ownerType: Extract<WalletOwnerType, "customer" | "merchant">,
  ownerId: string
): Promise<Wallet[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("wallets")
    .select("*")
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId)
    .order("is_primary", { ascending: false });

  if (error) return [];
  return (data ?? []) as Wallet[];
}

export async function getWalletTransactions(
  walletId: string,
  limit = 20
): Promise<WalletTransaction[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("wallet_id", walletId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as WalletTransaction[];
}

export async function getCustomerWalletSummary(profileId: string): Promise<{
  profile: CustomerProfile | null;
  wallets: Wallet[];
  transactions: WalletTransaction[];
}> {
  const wallets = await getUserWallets("customer", profileId);
  const primary = wallets.find((w) => w.is_primary) ?? wallets[0];
  const transactions = primary
    ? await getWalletTransactions(primary.id)
    : [];

  return {
    profile: await getCustomerProfile(profileId),
    wallets,
    transactions,
  };
}

export type CustomerPurchaseRow = {
  order_id: string;
  store_id: string;
  store_name: string;
  total: number;
  status: string;
  paid_at: string | null;
  created_at: string;
};

export async function getCustomerPurchaseHistory(
  profileId: string,
  limit = 50
): Promise<CustomerPurchaseRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("v_customer_purchase_history")
    .select("*")
    .eq("customer_id", profileId)
    .eq("status", "paid")
    .order("paid_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as CustomerPurchaseRow[];
}

export async function getCustomerWalletSummaryAdmin(profileId: string) {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data: wallets } = await admin
    .from("wallets")
    .select("*")
    .eq("owner_type", "customer")
    .eq("owner_id", profileId)
    .order("is_primary", { ascending: false });

  const primary = (wallets ?? []).find((w) => w.is_primary) ?? wallets?.[0];
  let transactions: WalletTransaction[] = [];
  if (primary) {
    const { data } = await admin
      .from("wallet_transactions")
      .select("*")
      .eq("wallet_id", primary.id)
      .order("created_at", { ascending: false })
      .limit(20);
    transactions = (data ?? []) as WalletTransaction[];
  }

  const { data: profile } = await admin
    .from("customer_profiles")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  return {
    profile: profile as CustomerProfile | null,
    wallets: (wallets ?? []) as Wallet[],
    transactions,
  };
}

export async function getCustomerPurchaseHistoryAdmin(
  profileId: string,
  limit = 50
): Promise<CustomerPurchaseRow[]> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("v_customer_purchase_history")
    .select("*")
    .eq("customer_id", profileId)
    .eq("status", "paid")
    .order("paid_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as CustomerPurchaseRow[];
}

export async function getMerchantWalletSummaryAdmin(profileId: string) {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data: wallets } = await admin
    .from("wallets")
    .select("*")
    .eq("owner_type", "merchant")
    .eq("owner_id", profileId)
    .order("is_primary", { ascending: false });

  const primary = (wallets ?? []).find((w) => w.is_primary) ?? wallets?.[0];
  let transactions: WalletTransaction[] = [];
  if (primary) {
    const { data } = await admin
      .from("wallet_transactions")
      .select("*")
      .eq("wallet_id", primary.id)
      .order("created_at", { ascending: false })
      .limit(20);
    transactions = (data ?? []) as WalletTransaction[];
  }

  const { data: profile } = await admin
    .from("merchant_profiles")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  return {
    profile: profile as MerchantProfile | null,
    wallets: (wallets ?? []) as Wallet[],
    transactions,
  };
}

export async function getMerchantWalletSummary(profileId: string): Promise<{
  profile: MerchantProfile | null;
  wallets: Wallet[];
  transactions: WalletTransaction[];
}> {
  const wallets = await getUserWallets("merchant", profileId);
  const primary = wallets.find((w) => w.is_primary) ?? wallets[0];
  const transactions = primary
    ? await getWalletTransactions(primary.id)
    : [];

  return {
    profile: await getMerchantProfile(profileId),
    wallets,
    transactions,
  };
}
