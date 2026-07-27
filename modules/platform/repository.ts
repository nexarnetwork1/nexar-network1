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
