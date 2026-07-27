import Link from "next/link";
import { getCurrentProfile } from "@/modules/users/repository";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";

export default async function MerchantDashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, status, mode")
    .eq("owner_id", profile?.id ?? "")
    .single();

  const isPaymentsOnly = store?.mode === "payments_only";

  const [{ count: pendingOrders }, { count: paidOrders }, { data: merchantProfile }] =
    store
      ? await Promise.all([
          supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("store_id", store.id)
            .eq("status", "pending_payment"),
          supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("store_id", store.id)
            .eq("status", "paid"),
          supabase
            .from("merchant_profiles")
            .select("total_revenue_usd")
            .eq("profile_id", profile?.id ?? "")
            .maybeSingle(),
        ])
      : [{ count: 0 }, { count: 0 }, { data: null }];

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold">
        {store?.name ?? "Merchant Dashboard"}
      </h1>
      <p className="mt-2 text-muted">
        {isPaymentsOnly
          ? "Create payment requests, share QR codes, and track revenue."
          : "Manage products, orders, and payments."}
      </p>

      {store && (
        <div className="mt-6 flex gap-4 text-sm">
          <span className="rounded-full border border-border px-3 py-1 capitalize">
            {store.status}
          </span>
          <span className="rounded-full border border-border px-3 py-1 capitalize">
            {store.mode.replace("_", " ")}
          </span>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card/40 p-5">
          <p className="text-xs uppercase text-muted">Pending orders</p>
          <p className="mt-2 font-heading text-2xl text-amber-400">{pendingOrders ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card/40 p-5">
          <p className="text-xs uppercase text-muted">Completed orders</p>
          <p className="mt-2 font-heading text-2xl text-emerald-400">{paidOrders ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card/40 p-5">
          <p className="text-xs uppercase text-muted">Net revenue</p>
          <p className="mt-2 font-heading text-2xl text-gold">
            ${Number(merchantProfile?.total_revenue_usd ?? 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        {isPaymentsOnly ? (
          <>
            <Link href="/merchant/invoices/new">
              <Button>New payment request</Button>
            </Link>
            <Link href="/merchant/store">
              <Button variant="secondary">QR codes</Button>
            </Link>
          </>
        ) : (
          <>
            <Link href="/merchant/products/new">
              <Button>Add product</Button>
            </Link>
            <Link href="/merchant/orders">
              <Button variant="secondary">View orders</Button>
            </Link>
          </>
        )}
        <Link href="/merchant/revenue">
          <Button variant="secondary">Revenue</Button>
        </Link>
      </div>
    </div>
  );
}
