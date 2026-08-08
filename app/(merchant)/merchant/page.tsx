import Link from "next/link";
import { getCurrentProfile } from "@/modules/users/repository";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/Button";
import {
  DashboardActions,
  DashboardSection,
  DashboardStat,
  DashboardStats,
} from "@/components/dashboard";

export default async function MerchantDashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = createAdminClient();

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
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title={store?.name ?? "Merchant Dashboard"}
        description={
          isPaymentsOnly
            ? "Create payment requests, share QR codes, and track revenue."
            : "Manage products, orders, and payments."
        }
        actions={
          <DashboardActions>
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
          </DashboardActions>
        }
      />

      {store && (
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full border border-border px-3 py-1 capitalize">
            {store.status}
          </span>
          <span className="rounded-full border border-border px-3 py-1 capitalize">
            {store.mode.replace("_", " ")}
          </span>
        </div>
      )}

      <DashboardStats columns={3}>
        <DashboardStat label="Pending orders" value={pendingOrders ?? 0} tone="warning" />
        <DashboardStat label="Completed orders" value={paidOrders ?? 0} tone="success" />
        <DashboardStat
          label="Net revenue"
          value={`$${Number(merchantProfile?.total_revenue_usd ?? 0).toFixed(2)}`}
          tone="gold"
        />
      </DashboardStats>
    </div>
  );
}
