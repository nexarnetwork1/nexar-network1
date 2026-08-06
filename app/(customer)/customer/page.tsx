import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { createClient } from "@/lib/supabase/server";
import { getUnreadNotificationCount } from "@/modules/notifications/repository";
import {
  DashboardCard,
  DashboardSection,
  DashboardStat,
  DashboardStats,
} from "@/components/dashboard";

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
  if (!profile) {
  redirect("/login?redirect=/customer");
}

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
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title={`Welcome, ${profile.full_name ?? "Customer"}`}
        description="Your account at a glance"
      />

      <DashboardStats columns={5}>
        <DashboardStat label="Pending orders" value={pendingOrders ?? 0} tone="gold" />
        <DashboardStat label="Unpaid invoices" value={pendingInvoices ?? 0} tone="warning" />
        <DashboardStat label="Unread notifications" value={unreadNotifications} />
        <DashboardStat label="Total orders" value={wallet?.total_orders ?? 0} />
        <DashboardStat
          label="Total spent"
          value={`$${Number(wallet?.total_spent_usd ?? 0).toFixed(2)}`}
        />
      </DashboardStats>

      <DashboardSection title="Account">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ACCOUNT_LINKS.map((link) => (
            <DashboardCard as="li" key={link.href} flush interactive>
              <Link href={link.href} className="block rounded-2xl p-5">
                <p className="font-medium text-white">{link.label}</p>
                <p className="mt-1 text-sm text-muted">{link.description}</p>
              </Link>
            </DashboardCard>
          ))}
        </ul>
      </DashboardSection>
    </div>
  );
}
