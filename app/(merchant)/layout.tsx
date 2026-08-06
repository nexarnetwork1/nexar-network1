import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock } from "lucide-react";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { signOutAction } from "@/modules/auth/actions";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { MerchantRealtimeProvider } from "@/components/realtime/MerchantRealtimeProvider";
import { CommerceAuthShell } from "@/components/commerce/auth/CommerceAuthShell";
import { Button } from "@/components/ui/Button";
import { ATLAS_BRAND, ATLAS_PORTAL_SUBTITLES } from "@/config/atlas-branding";
import { DashboardShell } from "@/components/dashboard";
import { merchantNav } from "@/config/dashboard-nav";
import { privateAreaMetadata } from "@/lib/constants/seo";

export const metadata = privateAreaMetadata;

export default async function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile || (profile.role !== "merchant" && profile.role !== "business")) {
    redirect(`/login?redirect=/merchant`);
  }

  const store = await getMerchantStore(profile.id);
  const isPaymentsOnly = store?.mode === "payments_only";

  const pendingApprovalBanner =
    store?.status === "pending" ? (
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-5 py-4">
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
    ) : null;

  return (
    <CommerceAuthShell>
      <DashboardShell
        sections={merchantNav({ paymentsOnly: isPaymentsOnly })}
        brand={ATLAS_BRAND.name}
        brandHref="/merchant"
        subtitle={store?.name ?? ATLAS_PORTAL_SUBTITLES.business}
        storageKey="merchant"
        banner={pendingApprovalBanner}
        actions={
          <>
            <NotificationBadge userId={profile.id} href="/merchant/notifications" />
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </>
        }
      >
        <MerchantRealtimeProvider>{children}</MerchantRealtimeProvider>
      </DashboardShell>
    </CommerceAuthShell>
  );
}
