import Link from "next/link";
import { redirect } from "next/navigation";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";
import { getCurrentProfile } from "@/modules/users/repository";
import { createClient } from "@/lib/supabase/server";
import { getUnreadNotificationCount } from "@/modules/notifications/repository";

const ACCOUNT_LINKS = [
  { href: "/customer/orders", label: "Orders", description: "Track purchases and delivery" },
  { href: "/customer/invoices", label: "Invoices", description: "View and pay invoices" },
  { href: "/customer/addresses", label: "Addresses", description: "Shipping and billing addresses" },
  { href: "/customer/payment-methods", label: "Saved Payment Methods", description: "Crypto and card options" },
  { href: "/customer/wallet", label: "Wallets", description: "Balance and transactions" },
  { href: "/customer/purchases", label: "Downloads", description: "Purchase history" },
  { href: "/customer/notifications", label: "Notifications", description: "Order and payment alerts" },
  { href: "/customer/profile", label: "Account Settings", description: "Profile and preferences" },
];

export default async function CustomerDashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect(commerceAuthHref({ auth: "signin", redirect: "/customer" }));

  const supabase = await createClient();

  const [
    { count: pendingOrders },
    { count: pendingInvoices },
    { data: wallet },
    unreadNotifications,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", profile.id)
      .eq("status", "pending_payment"),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", profile.id)
      .in("status", ["pending", "draft"]),
    supabase
      .from("customer_profiles")
      .select("total_spent_usd, total_orders")
      .eq("profile_id", profile.id)
      .maybeSingle(),
    getUnreadNotificationCount(profile.id),
  ]);

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold">
        Welcome, {profile.full_name ?? "Customer"}
      </h1>
      <p className="mt-2 text-muted">Your account at a glance</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending orders" value={pendingOrders ?? 0} accent="gold" />
        <StatCard label="Unpaid invoices" value={pendingInvoices ?? 0} accent="amber" />
        <StatCard label="Unread notifications" value={unreadNotifications} />
        <StatCard label="Total orders" value={wallet?.total_orders ?? 0} />
        <StatCard
          label="Total spent"
          value={`$${Number(wallet?.total_spent_usd ?? 0).toFixed(2)}`}
        />
      </div>

      <h2 className="mt-12 font-heading text-xl font-semibold">Account</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ACCOUNT_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="block rounded-2xl border border-border bg-card/40 p-5 transition hover:border-gold/30"
            >
              <p className="font-medium text-white">{link.label}</p>
              <p className="mt-1 text-sm text-muted">{link.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: "gold" | "amber";
}) {
  const color =
    accent === "gold" ? "text-gold" : accent === "amber" ? "text-amber-400" : "text-white";
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5">
      <p className="text-xs uppercase text-muted">{label}</p>
      <p className={`mt-2 font-heading text-2xl ${color}`}>{value}</p>
    </div>
  );
}
