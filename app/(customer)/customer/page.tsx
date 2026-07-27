import Link from "next/link";
import { getCurrentProfile } from "@/modules/users/repository";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";

export default async function CustomerDashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [{ count: pendingOrders }, { count: pendingInvoices }, { data: wallet }] =
    await Promise.all([
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", profile?.id ?? "")
        .eq("status", "pending_payment"),
      supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", profile?.id ?? "")
        .in("status", ["pending", "draft"]),
      supabase
        .from("customer_profiles")
        .select("total_spent_usd")
        .eq("profile_id", profile?.id ?? "")
        .maybeSingle(),
    ]);

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold">
        Welcome, {profile?.full_name ?? "Customer"}
      </h1>
      <p className="mt-2 text-muted">
        Browse products, manage orders, and pay with crypto or card.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card/40 p-5">
          <p className="text-xs uppercase text-muted">Pending orders</p>
          <p className="mt-2 font-heading text-2xl text-gold">{pendingOrders ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card/40 p-5">
          <p className="text-xs uppercase text-muted">Unpaid invoices</p>
          <p className="mt-2 font-heading text-2xl text-amber-400">{pendingInvoices ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card/40 p-5">
          <p className="text-xs uppercase text-muted">Total spent</p>
          <p className="mt-2 font-heading text-2xl">
            ${Number(wallet?.total_spent_usd ?? 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/customer/browse">
          <Button>Browse products</Button>
        </Link>
        <Link href="/customer/cart">
          <Button variant="secondary">View cart</Button>
        </Link>
        {(pendingInvoices ?? 0) > 0 && (
          <Link href="/customer/invoices">
            <Button variant="secondary">Pay invoices</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
