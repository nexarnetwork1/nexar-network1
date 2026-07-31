import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock } from "lucide-react";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { signOutAction } from "@/modules/auth/actions";
import { authModalHref } from "@/lib/commerce/commerce-auth-url";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { MerchantRealtimeProvider } from "@/components/realtime/MerchantRealtimeProvider";
import { CommerceAuthShell } from "@/components/commerce/auth/CommerceAuthShell";
import { Button } from "@/components/ui/Button";

export default async function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "merchant") {
    redirect(authModalHref({ auth: "signin", redirect: "/merchant" }));
  }

  const store = await getMerchantStore(profile.id);
  const isPaymentsOnly = store?.mode === "payments_only";

  return (
    <CommerceAuthShell>
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
            {!isPaymentsOnly && (
              <Link href="/merchant/store/builder" className="text-muted hover:text-white">
                Store Builder
              </Link>
            )}
            <Link href="/merchant/revenue" className="text-muted hover:text-white">
              Revenue
            </Link>
            <Link href="/merchant/wallet" className="text-muted hover:text-white">
              Wallet
            </Link>
            <Link href="/merchant/customers" className="text-muted hover:text-white">
              Customers
            </Link>
            <Link href="/merchant/stores" className="text-muted hover:text-white">
              Stores
            </Link>
            <Link href="/merchant/disputes" className="text-muted hover:text-white">
              Disputes
            </Link>
            <Link href="/merchant/withdrawals" className="text-muted hover:text-white">
              Withdrawals
            </Link>
            <Link href="/merchant/analytics" className="text-muted hover:text-white">
              Analytics
            </Link>
            <Link href="/merchant/coupons" className="text-muted hover:text-white">
              Coupons
            </Link>
            <Link href="/merchant/webhooks" className="text-muted hover:text-white">
              Webhooks
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
      <main className="mx-auto max-w-7xl px-6 py-10">
        {store?.status === "pending" ? (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-5 py-4">
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden />
              <div>
                <p className="text-sm font-medium text-amber-200">Your store is awaiting approval</p>
                <p className="mt-1 text-xs text-muted">
                  {store.name} is under review. You can prepare your catalog while our team verifies
                  your storefront.
                </p>
              </div>
            </div>
            <Link href="/merchant/onboarding" className="text-xs text-gold hover:underline">
              View status
            </Link>
          </div>
        ) : null}
        <MerchantRealtimeProvider>{children}</MerchantRealtimeProvider>
      </main>
    </div>
    </CommerceAuthShell>
  );
}
