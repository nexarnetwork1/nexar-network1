import { createAdminClient } from "@/lib/supabase/admin";
import type { PlatformSettings } from "@/types";

export async function getPlatformSettings(): Promise<PlatformSettings | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_settings")
    .select("*")
    .limit(1)
    .single();

  if (error) return null;
  return data as PlatformSettings;
}

export async function getFeeSchedules() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("fee_schedules")
    .select("*")
    .order("effective_from", { ascending: false });

  if (error) return [];
  return data;
}

export async function getLatestFeeRates() {
  const schedules = await getFeeSchedules();
  const latest: Record<string, number> = {};

  for (const s of schedules) {
    if (!latest[s.payment_type]) {
      latest[s.payment_type] = Number(s.base_rate);
    }
  }

  return latest;
}

export async function getExchangeRates() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("exchange_rates")
    .select("*")
    .order("fetched_at", { ascending: false });

  if (error) return [];
  return data;
}

export async function getAllProfiles() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

export async function getAllStores() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("stores")
    .select("*, owner:profiles(id, full_name, email)")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

export async function getAllPromotions() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("merchant_promotions")
    .select("*, store:stores(id, name, slug)")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

export async function getAuditLogs(limit = 100) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("audit_logs")
    .select("*, actor:profiles(id, full_name, email)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data;
}

export async function getAllPaymentSessions() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("payment_sessions")
    .select("*, invoice:invoices(invoice_number), order:orders(id, subtotal)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return [];
  return data;
}

export async function getAllSettlements() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("settlements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return [];
  return data;
}

export async function getSupportedCurrencies() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("supported_currencies")
    .select("*")
    .order("sort_order");

  if (error) return [];
  return data;
}

export async function getActiveSupportedCurrencies() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("supported_currencies")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) return [];
  return data;
}

export async function getPaymentMethods() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("payment_methods")
    .select("*")
    .eq("is_active", true)
    .order("code");

  if (error) return [];
  return data;
}

export async function getRecentPaymentStatusHistory(limit = 50) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("payment_status_history")
    .select("*, session:payment_sessions(id, method, amount_usd)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data;
}

export async function getCustomers() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("*, customer_profile:customer_profiles(*)")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

export async function getCustomerById(id: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("*, customer_profile:customer_profiles(*)")
    .eq("id", id)
    .eq("role", "customer")
    .maybeSingle();

  if (error) return null;
  return data;
}

export async function getMerchantDetail(storeId: string) {
  const admin = createAdminClient();
  const { data: store, error } = await admin
    .from("stores")
    .select(`
      *,
      owner:profiles(id, full_name, email, wallet_address, created_at),
      store_settings(*),
      qr_codes(*),
      promotions:merchant_promotions(*)
    `)
    .eq("id", storeId)
    .maybeSingle();

  if (error || !store) return null;

  const { data: merchantProfile } = await admin
    .from("merchant_profiles")
    .select("*")
    .eq("profile_id", store.owner_id)
    .maybeSingle();

  return { ...store, merchant_profile: merchantProfile };
}

export async function getAllProducts(limit = 200) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("products")
    .select("*, store:stores(id, name, slug, status)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data;
}

export async function getTreasurySummary() {
  const admin = createAdminClient();

  const [{ data: wallet }, { data: settings }] = await Promise.all([
    admin
      .from("wallets")
      .select("id, address, label, created_at, updated_at")
      .eq("owner_type", "treasury")
      .maybeSingle(),
    admin.from("platform_settings").select("treasury_wallet_address, updated_at").limit(1).maybeSingle(),
  ]);

  if (!wallet) {
    return { wallet: null, transactions: [], totalFees: 0, address: settings?.treasury_wallet_address ?? null };
  }

  const [{ data: transactions }, { data: settlements }] = await Promise.all([
    admin
      .from("wallet_transactions")
      .select("*")
      .eq("wallet_id", wallet.id)
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("settlements")
      .select("platform_fee")
      .eq("status", "completed"),
  ]);

  const totalFees = (settlements ?? []).reduce((s, r) => s + Number(r.platform_fee), 0);

  return {
    wallet,
    transactions: transactions ?? [],
    totalFees,
    address: wallet.address ?? settings?.treasury_wallet_address ?? null,
  };
}
