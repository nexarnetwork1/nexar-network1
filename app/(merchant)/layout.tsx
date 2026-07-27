import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { signOutAction } from "@/modules/auth/actions";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { Button } from "@/components/ui/Button";

export default async function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "merchant") {
    redirect("/login");
  }

  const store = await getMerchantStore(profile.id);
  const isPaymentsOnly = store?.mode === "payments_only";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <nav className="flex flex-wrap items-center gap-6 text-sm">
            <Link href="/merchant" className="font-heading text-gold">
              Merchant
            </Link>
            {!isPaymentsOnly && (
              <>
                <Link href="/merchant/products" className="text-muted hover:text-white">
                  Products
                </Link>
                <Link href="/merchant/categories" className="text-muted hover:text-white">
                  Categories
                </Link>
              </>
            )}
            <Link href="/merchant/orders" className="text-muted hover:text-white">
              Orders
            </Link>
            <Link href="/merchant/invoices" className="text-muted hover:text-white">
              Invoices
            </Link>
            {isPaymentsOnly && (
              <Link href="/merchant/invoices/new" className="text-muted hover:text-white">
                New payment
              </Link>
            )}
            <Link href="/merchant/store" className="text-muted hover:text-white">
              {isPaymentsOnly ? "QR & Settings" : "Store"}
            </Link>
            <Link href="/merchant/revenue" className="text-muted hover:text-white">
              Revenue
            </Link>
            <Link href="/merchant/analytics" className="text-muted hover:text-white">
              Analytics
            </Link>
            <NotificationBadge userId={profile.id} href="/merchant/notifications" />
            <Link href="/merchant/profile" className="text-muted hover:text-white">
              Profile
            </Link>
          </nav>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}
