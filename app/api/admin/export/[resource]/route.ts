import { withErrorHandler } from "@/api";
import { requireSuperAdmin } from "@/modules/users/repository";
import { createAdminClient } from "@/lib/supabase/admin";
import { toCsv, csvResponse } from "@/utils/export/csv";
import { getTreasurySummary } from "@/modules/platform/repository";

const RESOURCES = [
  "orders",
  "payments",
  "invoices",
  "merchants",
  "customers",
  "audit-logs",
  "treasury",
] as const;

type Resource = (typeof RESOURCES)[number];

async function handler(
  _request: Request,
  context?: { params: Promise<Record<string, string>> }
): Promise<Response> {
  await requireSuperAdmin();
  const params = await (context?.params ?? Promise.resolve({ resource: "" }));
  const resource = params.resource;
  if (!RESOURCES.includes(resource as Resource)) {
    return Response.json({ error: "Unknown export resource" }, { status: 404 });
  }

  const admin = createAdminClient();
  const date = new Date().toISOString().slice(0, 10);

  switch (resource as Resource) {
    case "orders": {
      const { data } = await admin
        .from("orders")
        .select("id, status, subtotal, platform_fee, merchant_amount, currency, paid_at, created_at, store:stores(name), customer:profiles(email)")
        .order("created_at", { ascending: false })
        .limit(5000);
      const rows = (data ?? []).map((o) => ({
        id: o.id,
        store: (o.store as { name?: string })?.name ?? "",
        customer: (o.customer as { email?: string })?.email ?? "",
        status: o.status,
        subtotal: o.subtotal,
        platform_fee: o.platform_fee,
        merchant_amount: o.merchant_amount,
        currency: o.currency,
        paid_at: o.paid_at,
        created_at: o.created_at,
      }));
      return csvResponse(
        toCsv(rows, [
          { key: "id", label: "Order ID" },
          { key: "store", label: "Store" },
          { key: "customer", label: "Customer" },
          { key: "status", label: "Status" },
          { key: "subtotal", label: "Subtotal" },
          { key: "platform_fee", label: "Platform Fee" },
          { key: "merchant_amount", label: "Merchant Amount" },
          { key: "currency", label: "Currency" },
          { key: "paid_at", label: "Paid At" },
          { key: "created_at", label: "Created At" },
        ]),
        `orders-${date}.csv`
      );
    }
    case "payments": {
      const { data } = await admin
        .from("payment_sessions")
        .select("id, method, amount, currency, amount_usd, status, paid_at, created_at, invoice:invoices(invoice_number)")
        .order("created_at", { ascending: false })
        .limit(5000);
      const rows = (data ?? []).map((p) => ({
        id: p.id,
        invoice: (p.invoice as { invoice_number?: string })?.invoice_number ?? "",
        method: p.method,
        amount: p.amount,
        currency: p.currency,
        amount_usd: p.amount_usd,
        status: p.status,
        paid_at: p.paid_at,
        created_at: p.created_at,
      }));
      return csvResponse(
        toCsv(rows, [
          { key: "id", label: "Session ID" },
          { key: "invoice", label: "Invoice" },
          { key: "method", label: "Method" },
          { key: "amount", label: "Amount" },
          { key: "currency", label: "Currency" },
          { key: "amount_usd", label: "Amount USD" },
          { key: "status", label: "Status" },
          { key: "paid_at", label: "Paid At" },
          { key: "created_at", label: "Created At" },
        ]),
        `payments-${date}.csv`
      );
    }
    case "invoices": {
      const { data } = await admin
        .from("invoices")
        .select("id, invoice_number, amount, currency, status, issued_at, paid_at, customer:profiles(email), store:stores(name)")
        .order("issued_at", { ascending: false })
        .limit(5000);
      const rows = (data ?? []).map((i) => ({
        id: i.id,
        invoice_number: i.invoice_number,
        store: (i.store as { name?: string })?.name ?? "",
        customer: (i.customer as { email?: string })?.email ?? "",
        amount: i.amount,
        currency: i.currency,
        status: i.status,
        issued_at: i.issued_at,
        paid_at: i.paid_at,
      }));
      return csvResponse(
        toCsv(rows, [
          { key: "invoice_number", label: "Invoice Number" },
          { key: "store", label: "Store" },
          { key: "customer", label: "Customer" },
          { key: "amount", label: "Amount" },
          { key: "currency", label: "Currency" },
          { key: "status", label: "Status" },
          { key: "issued_at", label: "Issued At" },
          { key: "paid_at", label: "Paid At" },
        ]),
        `invoices-${date}.csv`
      );
    }
    case "merchants": {
      const { data } = await admin
        .from("stores")
        .select("id, name, slug, mode, status, wallet_address, created_at, owner:profiles(email, full_name)")
        .order("created_at", { ascending: false });
      const rows = (data ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        mode: s.mode,
        status: s.status,
        owner: (s.owner as { full_name?: string; email?: string })?.full_name ?? (s.owner as { email?: string })?.email ?? "",
        wallet_address: s.wallet_address,
        created_at: s.created_at,
      }));
      return csvResponse(
        toCsv(rows, [
          { key: "name", label: "Store" },
          { key: "slug", label: "Slug" },
          { key: "mode", label: "Mode" },
          { key: "status", label: "Status" },
          { key: "owner", label: "Owner" },
          { key: "wallet_address", label: "Wallet" },
          { key: "created_at", label: "Created At" },
        ]),
        `merchants-${date}.csv`
      );
    }
    case "customers": {
      const { data } = await admin
        .from("profiles")
        .select("id, email, full_name, wallet_address, created_at, customer_profile:customer_profiles(total_orders, total_spent_usd)")
        .eq("role", "customer")
        .order("created_at", { ascending: false });
      const rows = (data ?? []).map((c) => ({
        email: c.email,
        full_name: c.full_name,
        wallet_address: c.wallet_address,
        total_orders: (c.customer_profile as { total_orders?: number })?.total_orders ?? 0,
        total_spent_usd: (c.customer_profile as { total_spent_usd?: number })?.total_spent_usd ?? 0,
        created_at: c.created_at,
      }));
      return csvResponse(
        toCsv(rows, [
          { key: "email", label: "Email" },
          { key: "full_name", label: "Name" },
          { key: "wallet_address", label: "Wallet" },
          { key: "total_orders", label: "Orders" },
          { key: "total_spent_usd", label: "Total Spent USD" },
          { key: "created_at", label: "Joined" },
        ]),
        `customers-${date}.csv`
      );
    }
    case "audit-logs": {
      const { data } = await admin
        .from("audit_logs")
        .select("action, entity_type, entity_id, actor_role, created_at, actor:profiles(email)")
        .order("created_at", { ascending: false })
        .limit(5000);
      const rows = (data ?? []).map((l) => ({
        action: l.action,
        entity_type: l.entity_type,
        entity_id: l.entity_id,
        actor: (l.actor as { email?: string })?.email ?? "",
        actor_role: l.actor_role,
        created_at: l.created_at,
      }));
      return csvResponse(
        toCsv(rows, [
          { key: "created_at", label: "Time" },
          { key: "action", label: "Action" },
          { key: "entity_type", label: "Entity Type" },
          { key: "entity_id", label: "Entity ID" },
          { key: "actor", label: "Actor" },
          { key: "actor_role", label: "Role" },
        ]),
        `audit-logs-${date}.csv`
      );
    }
    case "treasury": {
      const summary = await getTreasurySummary();
      const rows = summary.transactions.map((t) => ({
        tx_type: t.tx_type,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        tx_hash: t.tx_hash,
        created_at: t.created_at,
      }));
      return csvResponse(
        toCsv(rows, [
          { key: "created_at", label: "Date" },
          { key: "tx_type", label: "Type" },
          { key: "amount", label: "Amount" },
          { key: "currency", label: "Currency" },
          { key: "status", label: "Status" },
          { key: "tx_hash", label: "Tx Hash" },
        ]),
        `treasury-${date}.csv`
      );
    }
    default:
      return Response.json({ error: "Unknown resource" }, { status: 404 });
  }
}

export const GET = withErrorHandler(handler);
