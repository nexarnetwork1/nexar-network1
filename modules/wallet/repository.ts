import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
