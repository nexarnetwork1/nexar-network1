import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/modules/users/repository";
import { signOutAction } from "@/modules/auth/actions";
import { CartBadgeClient } from "@/components/cart/CartBadgeClient";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { CustomerRealtimeProvider } from "@/components/realtime/CustomerRealtimeProvider";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "customer") {
    redirect("/login");
  }

  const supabase = await createClient();
  const { count: pendingInvoices } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", profile.id)
    .in("status", ["pending", "draft"]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <nav className="flex flex-wrap items-center gap-6 text-sm">
            <Link href="/customer" className="font-heading text-gold">
              Nexar
            </Link>
            <Link href="/marketplace/browse" className="text-muted hover:text-white">
              Browse
            </Link>
            <CartBadgeClient href="/customer/cart" />
            <Link href="/customer/orders" className="text-muted hover:text-white">
              Orders
            </Link>
            <Link href="/customer/wishlist" className="text-muted hover:text-white">
              Wishlist
            </Link>
            <Link href="/customer/invoices" className="text-muted hover:text-white">
              Invoices
              {(pendingInvoices ?? 0) > 0 && (
                <span className="ml-1 text-amber-400">({pendingInvoices})</span>
              )}
            </Link>
            <Link href="/customer/wallet" className="text-muted hover:text-white">
              Wallet
            </Link>
            <Link href="/customer/purchases" className="text-muted hover:text-white">
              History
            </Link>
            <Link href="/customer/payment-methods" className="text-muted hover:text-white">
              Payment methods
            </Link>
            <Link href="/customer/profile" className="text-muted hover:text-white">
              Profile
            </Link>
            <Link href="/customer/disputes" className="text-muted hover:text-white">
              Disputes
            </Link>
            <NotificationBadge userId={profile.id} />
          </nav>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">
        <CustomerRealtimeProvider>{children}</CustomerRealtimeProvider>
      </main>
    </div>
  );
}
