import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { signOutAction } from "@/modules/auth/actions";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { CustomerRealtimeProvider } from "@/components/realtime/CustomerRealtimeProvider";
import { CommerceAuthShell } from "@/components/commerce/auth/CommerceAuthShell";
import { Button } from "@/components/ui/Button";
import { createAdminClient } from "@/lib/supabase/admin";
import { ATLAS_BRAND, ATLAS_PORTAL_SUBTITLES } from "@/config/atlas-branding";
import { DashboardShell } from "@/components/dashboard";
import { customerNav } from "@/config/dashboard-nav";
import { privateAreaMetadata } from "@/lib/constants/seo";

export const metadata = privateAreaMetadata;

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "customer") {
    redirect(`/login?redirect=/customer`);
  }

  const supabase = createAdminClient();
  const { count: pendingInvoices } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", profile.id)
    .in("status", ["pending", "draft"]);

  return (
    <CommerceAuthShell>
      <DashboardShell
        sections={customerNav({ pendingInvoices })}
        brand={ATLAS_BRAND.name}
        brandHref="/customer"
        subtitle={ATLAS_PORTAL_SUBTITLES.customer}
        storageKey="customer"
        actions={
          <>
            <NotificationBadge userId={profile.id} />
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </>
        }
      >
        <CustomerRealtimeProvider>{children}</CustomerRealtimeProvider>
      </DashboardShell>
    </CommerceAuthShell>
  );
}
