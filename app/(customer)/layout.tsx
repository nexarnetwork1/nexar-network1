import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { signOutAction } from "@/modules/auth/actions";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { CustomerRealtimeProvider } from "@/components/realtime/CustomerRealtimeProvider";
import { CommerceAuthShell } from "@/components/commerce/auth/CommerceAuthShell";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
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
    redirect(commerceAuthHref({ auth: "signin", redirect: "/customer" }));
  }

  const supabase = await createClient();
  const { count: pendingInvoices } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", profile.id)
    .in("status", ["pending", "draft"]);

  return (
    <CommerceAuthShell>
      <DashboardShell
        sections={customerNav({ pendingInvoices })}
        brand="Nexar Commerce"
        brandHref="/customer"
        subtitle="Customer account"
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
