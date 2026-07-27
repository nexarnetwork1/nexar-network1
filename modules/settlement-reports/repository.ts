import { createAdminClient } from "@/lib/supabase/admin";
import { getHeldEscrowBalance } from "@/modules/escrow/repository";
import type { SettlementReport, SettlementReportMetrics, SettlementReportPeriod } from "@/types";

function getPeriodBounds(
  periodType: SettlementReportPeriod,
  referenceDate = new Date()
): { start: string; end: string } {
  const d = new Date(referenceDate);
  if (periodType === "daily") {
    const start = d.toISOString().slice(0, 10);
    return { start, end: start };
  }
  if (periodType === "weekly") {
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: monday.toISOString().slice(0, 10), end: sunday.toISOString().slice(0, 10) };
  }
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export async function generateSettlementReport(params: {
  storeId?: string;
  periodType: SettlementReportPeriod;
  generatedBy?: string;
  referenceDate?: Date;
}): Promise<SettlementReport | null> {
  const admin = createAdminClient();
  const { start, end } = getPeriodBounds(params.periodType, params.referenceDate);
  const startIso = `${start}T00:00:00.000Z`;
  const endIso = `${end}T23:59:59.999Z`;

  let ordersQuery = admin
    .from("orders")
    .select("id, status, subtotal, platform_fee, merchant_amount, store_id")
    .gte("created_at", startIso)
    .lte("created_at", endIso);
  if (params.storeId) ordersQuery = ordersQuery.eq("store_id", params.storeId);

  const { data: orders } = await ordersQuery;

  let paymentsQuery = admin
    .from("payment_sessions")
    .select("id, status, amount_usd, order_id")
    .gte("created_at", startIso)
    .lte("created_at", endIso);
  if (params.storeId && orders?.length) {
    paymentsQuery = paymentsQuery.in(
      "order_id",
      orders.map((o) => o.id)
    );
  }

  const { data: payments } = await paymentsQuery;

  const paidOrders = (orders ?? []).filter((o) => o.status === "paid");
  const refundedOrders = (orders ?? []).filter((o) => o.status === "refunded");
  const failedPayments = (payments ?? []).filter((p) =>
    ["failed", "expired", "cancelled"].includes(p.status)
  );

  const grossRevenue = paidOrders.reduce((s, o) => s + Number(o.subtotal), 0);
  const platformFees = paidOrders.reduce((s, o) => s + Number(o.platform_fee), 0);
  const netRevenue = paidOrders.reduce((s, o) => s + Number(o.merchant_amount), 0);
  const refunds = refundedOrders.reduce((s, o) => s + Number(o.subtotal), 0);
  const escrowBalance = params.storeId ? await getHeldEscrowBalance(params.storeId) : 0;

  const metrics: SettlementReportMetrics = {
    gross_revenue: grossRevenue,
    platform_fees: platformFees,
    net_revenue: netRevenue,
    refunds,
    escrow_balance: escrowBalance,
    completed_orders: paidOrders.length,
    failed_payments: failedPayments.length,
  };

  const { data, error } = await admin
    .from("settlement_reports")
    .upsert(
      {
        store_id: params.storeId ?? null,
        period_type: params.periodType,
        period_start: start,
        period_end: end,
        metrics,
        generated_by: params.generatedBy ?? null,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "store_id,period_type,period_start,period_end" }
    )
    .select("*")
    .single();

  if (error) return null;
  return data as SettlementReport;
}

export async function getSettlementReports(params: {
  storeId?: string;
  periodType?: SettlementReportPeriod;
  limit?: number;
}): Promise<SettlementReport[]> {
  const admin = createAdminClient();
  let query = admin.from("settlement_reports").select("*").order("period_start", { ascending: false });
  if (params.storeId) query = query.eq("store_id", params.storeId);
  if (params.periodType) query = query.eq("period_type", params.periodType);
  const { data } = await query.limit(params.limit ?? 50);
  return (data ?? []) as SettlementReport[];
}
